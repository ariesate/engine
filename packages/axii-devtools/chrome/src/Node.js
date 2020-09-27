'use strict';

import { Node } from 'butterfly-dag'
import $ from 'jquery'
import './Node.less'

export default class BaseNode extends Node {
  constructor(opts) {
    super(opts);
    this.options = opts;
  }
  draw = (opts) => {
    let container = $('<div class="relation-node"></div>')
      .css('top', opts.top)
      .css('left', opts.left)
      .attr('id', opts.id)
      .css('background-color', opts.options.color);

    let logoContainer = $(`<div class="logo-container">
        ${opts.options.name}
        ${opts.options.changed ? '*' : ''}
    </div>`);
    logoContainer.css('background-color', opts.options.color);

    container.append(logoContainer);

    return container[0];
  }
  focus = ({ options }) => {
    console.log(options)
    if (options.onFocus) {
      options.onFocus(options)
    }
  }
}

