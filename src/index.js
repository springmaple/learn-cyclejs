import { makeDOMDriver } from '@cycle/dom';
import { run } from '@cycle/run';

// noinspection ES6UnusedImports
import Snabbdom from 'snabbdom-pragma';

function main(sources) {
    const sinks = {
        DOM: sources.DOM.select('input').events('click')
            .map(ev => ev.target.checked)
            .startWith(false)
            .map(toggled =>
                <div>
                    <input type="checkbox"/> Toggle me
                    <p>{ toggled ? 'ON' : 'off' }</p>
                </div>
            )
    };
    return sinks;
}

const drivers = {
    DOM: makeDOMDriver('#app')
};

run(main, drivers);