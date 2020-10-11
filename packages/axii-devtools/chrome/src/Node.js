'use strict';

import { Node } from 'butterfly-dag'
import $ from 'jquery'
import './Node.less'

export default class BaseNode extends Node {
  constructor(opts) {
    super(opts);
    this.options = opts;
  }
  draw = ({ top, left, options: meta}) => {
    let container = $('<div class="relation-node"></div>')
      .css('top', top)
      .css('left', left)
      .attr('id', meta.id)
      .css('background-color', meta.color);

    let logoContainer = $(`<div class="logo-container">
        ${meta.name}
        ${meta.changed ? '*' : ''}
    </div>`);
    logoContainer.css('background-color', meta.color);

    container.append(logoContainer);

    container.on('click', () => {
      if(meta.onClick) {
        meta.onClick(meta)
      }
    })

    return container[0];
  }
  focus = () => {
    $(this.dom).addClass('active')
  }
  unFocus = () => {
    $(this.dom).removeClass('active')
  }
}

