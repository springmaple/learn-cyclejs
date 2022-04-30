import { DOMSource, VNode } from '@cycle/dom';
import { HistoryInput, Location } from '@cycle/history';
import { HTTPSource, RequestInput } from '@cycle/http';
import { MemoryStream, Stream } from 'xstream';

export declare function main(sources: {
    DOM: DOMSource,
    HTTP: HTTPSource,
    history: MemoryStream<Location>,
}): {
    DOM: Stream<VNode>,
    HTTP: Stream<RequestInput>,
    history: Stream<HistoryInput>,
};
