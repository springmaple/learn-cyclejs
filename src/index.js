import { makeDOMDriver } from '@cycle/dom';
import { makeHistoryDriver } from '@cycle/history';

import { makeHTTPDriver } from '@cycle/http';
import { run } from '@cycle/run';

// noinspection ES6UnusedImports
import Snabbdom from 'snabbdom-pragma';
import xs from "xstream";

function main(sources) {

    const loadHome$ = sources.history
        .filter(history => {
            const { pathname } = history;
            return pathname === "/";
        })
        .map(() => ({
            url: "https://hacker-news.firebaseio.com/v0/topstories.json",
            method: "GET",
            category: "feeds"
        }));

    const renderHome$ = sources.HTTP
        .select("feeds")
        .flatten()
        .map(res => {
            const itemIds = res.body.slice(0, 10);
            const fetches = Promise.all(itemIds.map(itemId => {
                return fetch(`https://hacker-news.firebaseio.com/v0/item/${ itemId }.json`)
            }));
            return xs.fromPromise(fetches);
        })
        .flatten()
        .map(response => {
            return xs.fromPromise(Promise.all(response.map(r => r.json())));
        })
        .flatten()
        .map(response => {
            return <ul>
                {
                    response.map(item => {
                        return <li>
                            <a id={ item.id } className="item-link" href="javascript:void(0)">{ item.title }</a>
                            <span> ({ item.score })</span>
                        </li>
                    })
                }
            </ul>
        });

    const onLinkClick$ = sources.DOM
        .select("a.item-link")
        .events("click")
        .map((e) => {
            const itemId = e.target.getAttribute("id");
            return `/item/${ itemId }`;
        });

    const loadItem$ = sources.history
        .map(history => {
            const { pathname } = history;
            const matches = pathname.match(/\/item\/(\d+)/);
            if (matches == null || matches.length !== 2)
                return null;
            return matches[ 1 ];
        })
        .filter(itemId => itemId != null)
        .map(itemId => {
            return {
                url: `https://hacker-news.firebaseio.com/v0/item/${ itemId }.json`,
                method: "GET",
                category: "item"
            };
        });

    const renderItem$ = sources.HTTP
        .select("item")
        .flatten()
        .map(data => {
            const { body } = data;
            return <div>
                <div><a href="javascript:void(0)" className="back-link">Back to home</a></div>
                <h4>{ body.title }</h4>
                <p>{ body.text }</p>
                <div>By: <a href={ `https://news.ycombinator.com/user?id=${ body.by }` }>{ body.by }</a></div>
                <div>Link: <a href={ body.url }>{ body.url }</a></div>
            </div>;
        });

    const backToHome$ = sources.DOM
        .select("a.back-link")
        .events("click")
        .map(() => "/")

    return {
        DOM: xs.merge(renderHome$, renderItem$),
        HTTP: xs.merge(loadHome$, loadItem$),
        history: xs.merge(onLinkClick$, backToHome$)
    }
}

const drivers = {
    DOM: makeDOMDriver('#app'),
    HTTP: makeHTTPDriver(),
    history: makeHistoryDriver()
};

run(main, drivers);