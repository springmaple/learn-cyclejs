import { makeDOMDriver } from '@cycle/dom';
import { makeHistoryDriver } from '@cycle/history';
import { makeHTTPDriver } from '@cycle/http';
import { run } from '@cycle/run';
import flattenConcurrently from 'xstream/extra/flattenConcurrently';
import html from 'snabby';
import xs from 'xstream';

/** @type {import('./index').main} */
function main(sources) {
    const homeLocation$ = sources.history
        .filter(({ pathname }) => pathname === '/');

    const feedRequest$ = homeLocation$
        .map(() => ({
            url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
            category: 'feed',
        }));

    const feedItemIds$ = sources.HTTP
        .select('feed')
        .flatten() // only keep the latest set of item IDs
        .map(res => res.body)
        .map(itemIds => itemIds.slice(0, 10)); // TODO: put the initial number of items to load in the state

    const feedItemRequest$ = feedItemIds$
        .map((itemIds) => xs.from(itemIds)
            .map((itemId) => ({
                url: `https://hacker-news.firebaseio.com/v0/item/${itemId}.json`,
                category: 'feedItem',
            }))
        )
        .flatten(); // switch to a new stream of item requests for each set of item IDs

    const feedItemResponse$ = sources.HTTP
        .select('feedItem')
        .compose(flattenConcurrently); // emit each item response as they are received

    const feedItems$ = xs.combine(feedItemIds$, feedItemResponse$)
        .fold((itemMap, [itemIds, itemResponse]) => {
            if (itemMap.size === 0) {
                for (const itemId of itemIds) {
                    itemMap.set(itemId, null);
                }
            }

            // responses are emitted one at a time
            // store each item as they are received
            const item = itemResponse.body;
            itemMap.set(item.id, item);

            return itemMap;
        }, new Map())
        .map(itemMap => Array.from(itemMap.values()))
        .filter(items => items.every(item => item !== null)); // only emit when all items have been received

    const homeVdom$ = feedItems$
        .map((items) => html`
            <ul>
                ${items.map((item) => html`
                    <li>
                        <a @class=${{
                            'item-link': true,
                        }} @attrs=${{
                            id: item.id,
                            href: `/item/${item.id}`,
                        }}>${item.title}</a>
                        <span> (${item.score})</span>
                    </li>
                `)}
            </ul>
        `);

    const itemLinkClickEvent$ = sources.DOM
        .select('a.item-link')
        .events('click', { preventDefault: true });

    const itemLinkNavigation$ = itemLinkClickEvent$
        .map((ev) => {
            const itemId = ev.ownerTarget.id;

            return `/item/${itemId}`;
        });

    const itemId$ = sources.history
        .map(({ pathname }) => pathname.match(/\/item\/(\d+)/)?.[1])
        .filter(itemId => itemId !== undefined);

    const itemRequest$ = itemId$
        .map((itemId) => ({
            url: `https://hacker-news.firebaseio.com/v0/item/${itemId}.json`,
            category: 'item',
        }));

    const itemResponse$ = sources.HTTP
        .select('item')
        .flatten(); // only keep the latest item response

    const itemVdom$ = itemResponse$
        .map(res => res.body)
        .map((item) => html`
            <div>
                <div>
                    <a @class=${{
                        'home-link': true,
                    }} @attrs=${{
                        href: '/',
                    }}>Back to home</a>
                </div>
                <h4>${item.title}</h4>
                <p>${item.text}</p>
                <div>
                    By: <a @class=${{
                    }} @attrs=${{
                        href: `https://news.ycombinator.com/user?id=${item.by}`,
                    }}>${item.by}</a>
                </div>
                <div>
                    Link: <a @class=${{
                    }} @attrs=${{
                        href: item.url,
                    }}>${item.url}</a>
                </div>
            </div>
        `);

    const homeLinkClickEvent$ = sources.DOM
        .select('a.home-link')
        .events('click', { preventDefault: true });

    const homeLinkNavigation$ = homeLinkClickEvent$
        .map(() => '/');

    return {
        DOM: xs.merge(homeVdom$, itemVdom$),
        HTTP: xs.merge(feedRequest$, feedItemRequest$, itemRequest$),
        history: xs.merge(itemLinkNavigation$, homeLinkNavigation$),
    };
}

const drivers = {
    DOM: makeDOMDriver('#app'),
    HTTP: makeHTTPDriver(),
    history: makeHistoryDriver(),
};

run(main, drivers);
