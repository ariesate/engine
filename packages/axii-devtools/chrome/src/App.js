/** @jsx createElement */
import { createElement, vnodeComputed } from 'axii'

export default function App({ indepTree }) {
    return <pre>{() => JSON.stringify(indepTree, null, 4)}</pre>
}
