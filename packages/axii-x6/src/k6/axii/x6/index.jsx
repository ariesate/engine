/** @jsx createElement */
import {
  tryToRaw,
  createElement,
  render,
  watch,
  traverse,
  useViewEffect,
  destroyComputed,
} from "axii";
import { createFlowGraph } from './graph';
import { Graph as X6Graph, Markup } from '@antv/x6'
import merge from 'lodash-es/merge';
import pick from 'lodash-es/pick';
import debounce from 'lodash-es/debounce';
import ShareContext from '../ShareContext';
import { getRegisterPort } from '../Port';
import { DEFAULT_SHAPE } from '../../Node';

function assignDefaultEdge(customEdge = {}, edge) {
  return merge({
    router: 'manhattan',
    attrs: {
      line: {
        stroke: customEdge.lineColor || '#5F95FF',
        strokeWidth: 1,
        targetMarker: {
          name: 'classic',
          size: 8,
        },
      },
      text: {
        fill: '#666',
      }
    },
  }, edge, customEdge);
}

export const Register = {
  htmlComponentMap: new Map(),
  registerHTMLComponent(name, func) {
    if (!this.htmlComponentMap.get(name)) {
      this.htmlComponentMap.set(name, func);
      X6Graph.registerHTMLComponent(name, func);
    } else {
      console.warn(`${name} has already register`);
    }
  },
  unregisterAll() {
    [...this.htmlComponentMap.keys()].forEach(k => {
      X6Graph.unregisterHTMLComponent(k);
    });
    this.htmlComponentMap.clear();
  },
  registerHTMLComponentRender({ getInject }) {
    return (node) => {
      const [graph, dm, NodeCpt, PortCpt, EdgeCpt] = getInject();
      const wrap = document.createElement('div')
      // nodeConfig is reactive
      const nodeConfig = dm.findNode(node.id);
      const shareContextValue = dm.shareContextValue;
      let { RegisterPort, getConfig: getPortConfig } = PortCpt;
      if (!RegisterPort && !getPortConfig) {
        const defaultCpt = getRegisterPort();
        RegisterPort = defaultCpt.RegisterPort,
        getPortConfig = defaultCpt.getConfig;
      }

      const effectCallbacks = [];

      function TopNodeRender() {
        useViewEffect(() => {
          const unEffectArr = effectCallbacks.map(fn => fn());
          return () => {
            unEffectArr.forEach((fn) => typeof fn === 'function' ? fn() : '');
          };
        });
        return (
          <ShareContext.Provider value={shareContextValue} >
            <NodeCpt
              node={nodeConfig}
              state={dm.insideState}
              RegisterPort={RegisterPort}
              onRemove={() => dm.removeIdOrCurrent(node.id)}
            />
          </ShareContext.Provider>
        );
      }

      const renderController = render(<TopNodeRender />, wrap);

      dm.once('dispose', () => {
        renderController.destroy();
        wrap.innerHTML = '';
      });

      // @TODO：约2帧的debounce
      let watchTokens = [];
      const refreshNodeSize = debounce(function refreshNodeSize(){
        watchTokens.forEach(token => destroyComputed(token));
        watchTokens = [];

        // TIP: 由于延时，组件有可能已经被卸载了
        if (!wrap.children[0]) {
          renderController.destroy();
          return
        }
        
        const { width, height } = (wrap.children[0].getBoundingClientRect());
        node.setProp({ width: width, height: height });

        // render port
        if (getPortConfig) {
          const portConfigArr = getPortConfig(nodeConfig.id);
          const ports = {
            groups: portConfigArr.map((portConfig, index) => {
              const { portId, position, size } = portConfig;
              return {
                [`${portId}${index}`]: {
                  position: [position.x, position.y],
                  attrs: {
                    fo: {
                      width: size.width,
                      height: size.height,
                      magnet: true,
                    }
                  }
                }
              };
            }).reduce((p, n) => Object.assign(p, n), {}),
            items: portConfigArr.map((portConfig, index) => {
              const { portId, position } = portConfig;
              return {
                id: portId,
                group: `${portId}${index}`,
                position,
              };
            }),
          };
          node.setProp('ports', ports);
          window.ports = ports;
        } else {
          console.error('Register Port getConfig method is undefined');
        }

        // render edge
        requestAnimationFrame(() => {
          // 先清除“边”
          graph.model.getEdges().forEach(edgeIns => {
            if (edgeIns.source.cell === nodeConfig.id) {
              edgeIns.remove();
            }
          });

          // TODO:x6不会添加完全重复的“边”
          nodeConfig.edges.forEach(edge => {
            const edgeConfig = EdgeCpt({ node: nodeConfig, edge });
            const c = assignDefaultEdge(edgeConfig, edge);
            const remoteId = c.id;
            delete c.id;
            const edgeIns = graph.addEdge({
              ...c,
            }); 
            // 监听并动态修改label
            const [_, token] = watch(() => [traverse(nodeConfig), traverse(edge)], () => {
              setTimeout(() => {
                const c = assignDefaultEdge(edgeConfig, edge);
                delete c.id;
                edgeIns.setLabels(c.labels);
                if (edgeConfig.lineColor !== undefined) {
                  edgeIns.setAttrs(c.attrs);
                }
              }, 30);
            });
            watchTokens.push(token);

            edgeIns.setData({ remoteId }, { silent: true });
          });
        });
      }, 30);

      // myNode的axii渲染完成之后的动作
      effectCallbacks.push(() => {
        // 节点数据修改
        watch(() => traverse(nodeConfig.data), () => {
          setTimeout(() => {
            refreshNodeSize();
          }, 25);
        });
        // 新增连接
        watch(() => nodeConfig.edges.length, () => {
          setTimeout(() => {
            refreshNodeSize();
          }, 25);
        });  
        refreshNodeSize();

        const portConfigArr = getPortConfig(nodeConfig.id);
        // 为了有新增的异步Port, @TODO: 如何从设计上消除"删除"的影响？
        watch(() => portConfigArr.length, () => {
          setTimeout(() => {
            refreshNodeSize();
          });
        });
        // 节点的连接点位置变动
        if (portConfigArr.length) {
          watch(() => portConfigArr.forEach(p => [p.position.x]), () => {
            refreshNodeSize();
          });
        }
      });

      return wrap;
    }
  },
  registerPortRender({ getDm }) {
    return args => {
      const dm = getDm();
      const { node, port } = args;
      const originNode = dm.findNode(node.id);
      const nodeComponent = dm.getShapeComponent(originNode.shape);
  
      const selectors = args.contentSelectors
      const container = selectors && selectors.foContent
      if (container) {
        const PortCpt = nodeComponent[1];
        const shareContextValue = dm.shareContextValue;
        
        render(<ShareContext.Provider value={shareContextValue} >
          <PortCpt node={originNode} port={port} />
        </ShareContext.Provider>, container);
      }
    }
  },
};

export const Graph = {
  graph: null,

  dm: null,

  getHtmlKey(n) {
    const registerKey = `${n || DEFAULT_SHAPE}-html`;
    return registerKey;
  },

  init(container, dm, config) {
    const graph = createFlowGraph(container, {
      ...config,
      getReadOnly: () => dm.readOnly.value,
      onPortRendered: Register.registerPortRender({
        getDm: () => this.dm,
      }),
      onAddEdge(nodeId, edge, edgeIns) {
        dm.addNewEdge(nodeId, edge).then(remoteId => {
          if (remoteId) {
            edgeIns.setData({ remoteId });
          }
        });
      },
    });

    this.syncMiniMap(config.minimap);

    const allShapeComponents = dm.getAllShapeComponents();

    allShapeComponents.forEach(([myNode, myPort, myEdge]) => {
      const shape = myNode.shape;
      const registerKey = this.getHtmlKey(shape);
      Register.registerHTMLComponent(registerKey, Register.registerHTMLComponentRender({
        // 运行时动态获取，防止泄露
        getInject: () => {
          return [
            this.graph,
            this.dm,
            ...this.dm.nodeShapeComponentMap.get(shape),
          ];
        },
      }));  
    });

    graph.on('cell:click', (e) => {
      const { cell } = e;
      if (cell.isNode()) {
        dm.selectNode(cell.id);
      } else if (cell.isEdge()) {
        const remoteId = cell.getData().remoteId;
        console.log('remoteId || cell.id: ', remoteId, cell.id);
        dm.selectEdge(remoteId || cell.id);
      }
    });
    graph.on('blank:click', (arg) => {      
      dm.selectNode();
    });

    graph.on('node:moved', ({ node }) => {
      const { x, y } = node.position();
      dm.syncNode(node.id, { x, y });
    });
    graph.on('blank:dblclick', ({ e, x, y}) => {
      dm.addNode({ x, y })
    });

    dm.on('remove', (id) => {
      console.log('[remove cb] id: ', id);
      const cells = graph.getCells();
      console.log('[remove cb] cell ids=', cells.map(cell => [cell.id, cell.getData().remoteId]));
      const cell = cells.find(cell => cell.getData().remoteId === id);
      let removedCell;
      if (cell) {
        removedCell = graph.removeCell(cell.id);
      } else {
        removedCell = graph.removeCell(id);
      }
    });
    dm.on('zoom-in', (v) => {
      graph.zoom(v);
    });
    dm.on('zoom-out', (v) => {
      graph.zoom(-v);
    });
    dm.on('addNode', (n) => {
      this.addNode(n);
    });
    dm.once('dispose', () => {
      this.dispose();
    });
    dm.on('notifyComponent', () => {
      this.syncMiniMap();
    });
    dm.on('node:changed', props => {
      const nodes = graph.model.getCells()
      nodes.forEach(n => {
        const { remoteId } = n.getData() || {};
        // TIP： 边 || 节点
        if ((remoteId === props.id && props.type === 'edge')|| (n.id === props.id && props.type === 'node')) {
          n.setProp(props.prop)
        }
      })
    })

    this.graph = graph;
    this.dm = dm;
    window.graph = graph;
  },

  renderNodes(nodes) {
    nodes.forEach(node => {
      this.addNode(tryToRaw(node));      
    });
  },

  syncMiniMap(img) {
    clearInterval(this.syncMiniMapSi);
    const task = () => {
      this.syncMiniMapSi = setTimeout(() => {
        requestIdleCallback(() => {
          graph.toPNG((dataUri) => {
            // 下载
            if (img) {
              requestIdleCallback(() => {
                img.src = dataUri;
                img.style.display = 'block';
                task();
              });
            }
          });
        });
      }, 1500);  
    }
    task();
  },

  addNode(nodeConfig) {
    const htmlKey = this.getHtmlKey(nodeConfig.shape);
    const nodeConfigView = nodeConfig.view;
    delete nodeConfig.view;

    const node = merge({
      ...nodeConfigView,
    }, nodeConfig, {
      shape: 'html',
      portMarkup: [ Markup.getForeignObjectMarkup() ],
      attrs: {
      },
      html: htmlKey,
      ports: {},      
    });

    const x6NodeInstance = this.graph.addNode(node);
  },
  exportData() {
    return this.graph.toJSON();
  },
  getNodePosition(id) {
    const allNodes = this.graph.model.getNodes();
    const targetNode = allNodes.find(n => n.id === id);
    if (targetNode) {
      return targetNode.position();
    }
  },
  updateEdge(edge, newEdgeConfig) {
    const allEdges = this.graph.model.getEdges();
    const edgeIns = allEdges.find(e => {
      if (e.id === edge.id) {
        return true;
      }
      return e.getData().remoteId === edge.id;
    });
    edgeIns.setLabels(newEdgeConfig.label || '');

    return pick(edgeIns, ['target', 'source', 'label', 'name', 'type']);
  },
  dispose() {
    clearTimeout(this.syncMiniMapSi);
    const { graph } = this;
    const cells = graph.getCells();
    cells.forEach((cell) => {
      if (cell.isNode()) {
        cell.removePorts();
      }
    });
    graph.removeCells(cells);
    graph.dispose();
    Register.unregisterAll();
  }
}


export const Connect = {
  transformNode(nodeConfig, [NodeCls, PortCls, EdgeCls]) {

  }
};


export const Data = {
  readNodes(nodeConfigArr) {
    
  }
}