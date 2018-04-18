import { createElement, render, Component } from 'areact'
import * as mstMod from 'novice/moduleSystem/modules/mst'
import Header from './Header'
import Main from './Main'
import Footer, { FILTER_ALL, FILTER_COMPLETED } from './Footer'


const todoMVC = (
  <div className="todoapp">
    <Header listeners={headerListeners} />
    <Main listeners={mainListeners} mapMSTToState={mainMapMSTToState} />
    <Footer bind="filter" mapMSTToState={footerMapMSTToState} />
  </div>
)


const controller = render(
  todoMVC,
  document.getElementById('root'),
)

// for debug
window.controller = controller
