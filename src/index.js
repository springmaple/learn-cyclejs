import { makeDOMDriver } from '@cycle/dom';

import { makeHTTPDriver } from '@cycle/http';
import { run } from '@cycle/run';

// noinspection ES6UnusedImports
import Snabbdom from 'snabbdom-pragma';
import xs from "xstream";

function main(sources) {
    const request$ = xs.of({
        url: "https://hacker-news.firebaseio.com/v0/topstories.json",
        method: "GET",
        category: "feeds"
    });

    const response$ = sources.HTTP
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
        .flatten();

    const vdom$ = response$.map(response => {
        return <ul>
            {
                response.map(item => <li key={ item.id }>{ item.title }</li>)
            }
        </ul>
    });

    return {
        DOM: vdom$,
        HTTP: request$,
    }
}

const drivers = {
    DOM: makeDOMDriver('#app'),
    HTTP: makeHTTPDriver()
};

run(main, drivers);