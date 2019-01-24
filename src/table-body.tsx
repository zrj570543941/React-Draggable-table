import {
  ConnectDragSource, ConnectDropTarget,
  DragSource, DragSourceMonitor, DropTarget, DropTargetMonitor, XYCoord,
} from 'react-dnd'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import styles from './table-body.scss'
import { IColumn, IOnExpandChange } from './interfaces'
import { Icon } from 'antd'
import classNames from 'classnames'
import { findRecordInTreeNode } from './utils'

const getDragDirection = (
  clientOffset: XYCoord,
  clientY: number,
  dropTargetHeight: number,
  dropTargetRecord: any,
) => {
  // console.log('dropTargetHeightIngetDir: ', dropTargetHeight)
  const tableRowHeight = dropTargetHeight
  if (Math.abs(clientOffset.y - clientY) > (tableRowHeight / 4) * 3 &&
    Math.abs(clientOffset.y - clientY) <= tableRowHeight) {
    return 'downward'
  } else if (Math.abs((clientOffset.y - clientY)) <= tableRowHeight / 4 &&
    Math.abs((clientOffset.y - clientY)) >= 0) {
    return 'upward'
  } else if (dropTargetRecord.type !== 'PAGE' &&
    Math.abs((clientOffset.y - clientY)) > tableRowHeight / 4 &&
    Math.abs((clientOffset.y - clientY)) <= (tableRowHeight / 4) * 3
  ) {
    return 'middle'
  }
}

const rowSource = {
  beginDrag(props: IBodyRowProps) {
    return {
      record: props.record,
    }
  },
  endDrag(props: IBodyRowProps, monitor: DragSourceMonitor, component: Component) {
    // console.log(component.getDecoratedComponentInstance())
    // component.getDecoratedComponentInstance().dragDirection = ''
    if (component) {
      const compDOM = (ReactDOM.findDOMNode(component) as any)

      compDOM.querySelector(`.firstTdInRow`).classList.remove('upward', 'dveownward', 'middle')
    }

  },
}

const rowTarget = {
  drop(props: IBodyRowProps, monitor: DropTargetMonitor, component: Component) {
    const dragRecord = monitor.getItem().record
    const hoverRecord = props.record
    const firstTdInRowClassList = (ReactDOM.findDOMNode(component)as any).querySelector(`.firstTdInRow`).classList
    // Don't replace items with themselves
    // console.log(findRecordInTreeNode(dragRecord, hoverRecord[props.childrenColumnName]).isFound)
    if (dragRecord.id === hoverRecord.id ||
      findRecordInTreeNode(hoverRecord, dragRecord[props.childrenColumnName]).isFound
    ) {
      return
    }
    ['middle', 'upward', 'downward'].forEach((dragDirection: string) => {
      if (firstTdInRowClassList.contains(dragDirection)) {
        props.moverow({dragRecord, hoverRecord: props.record, dragDirection })
      }
    })
    firstTdInRowClassList.remove('middle', 'upward', 'downward')
  },
  hover(props: IBodyRowProps, monitor: DropTargetMonitor, component: any) {
    // const dragRecord = monitor.getItem().record
    const hoverRecord = props.record
    // const dragRecord = monitor.getItem().record
    const compDOM = (ReactDOM.findDOMNode(component) as any)
    const dragDirection = getDragDirection(
      monitor.getClientOffset(),
      compDOM.getBoundingClientRect().top,
      compDOM.querySelector('.' + styles.tableRowWrap).getBoundingClientRect().height,
      hoverRecord,
    )
    compDOM.querySelector(`.firstTdInRow`).classList.remove('upward', 'downward', 'middle')
    compDOM.querySelector(`.firstTdInRow`).classList.add(dragDirection)

  },
}

interface IBodyRowProps {
  depth: number
  record: any
  childrenColumnName: string
  columns: IColumn[]
  rowKey: string
  expandedRowKeys: number[]
  onExpandChange: ({}: IOnExpandChange) => any
  initialClientOffset?: XYCoord
  clientOffset?: XYCoord
  isOver?: boolean
  connectDragSource?: ConnectDragSource
  connectDropTarget?: ConnectDropTarget
  moverow?: (...args: any[]) => any
  dragRow?: any
  style?: object
  className?: string
  togglefolder?: (...args: any[]) => any
}

@DropTarget('row', rowTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  // dropTargetDidDrop: monitor.didDrop(),
}))
@DragSource('row', rowSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  dragRow: monitor.getItem(),
  // clientOffset: monitor.getClientOffset(),
  // dragSourcemonitor: monitor,
  initialClientOffset: monitor.getInitialClientOffset(),
  // dragSourceDidDrop: monitor.didDrop(),
}))
// @DragLayer(((monitor) => ({
//   // clientOffset: monitor.getClientOffset(),
// })))
class BodyRow extends React.Component<IBodyRowProps> {
  public togglefolderInvokeCounter: number = 0
  public clientY: number
  public clientOffset: XYCoord
  // droptarget所在td的高度，而非整个droptarget的高度
  public dropTargetRowHeight: number
  constructor(props: any) {
    super(props)
  }
  public getSize = () => {
    this.clientY = (ReactDOM.findDOMNode(this) as any).getBoundingClientRect().top
    this.dropTargetRowHeight = (ReactDOM.findDOMNode(this) as any)
      .querySelector('.' + styles.tableRowWrap).getBoundingClientRect().height
    // console.log(this.clientY, this.dropTargetRowHeight)
    // console.log(this.dropTargetHeight)
  }

  // 拖拽完成后要更新clientY尺寸
  public componentDidUpdate() {
    if (!this.props.isOver) {
      (ReactDOM.findDOMNode(this) as any).querySelector(`.firstTdInRow`)
        .classList.remove('upward', 'downward', 'middle')
    }
  }
  public ifHasSubTree = () => {
    const {record, childrenColumnName} = this.props
    return record.type === 'FOLDER' &&
      record[childrenColumnName] &&
      record[childrenColumnName].length > 0
  }
  public ifShowSubTree = () => {
    const {record, rowKey, expandedRowKeys} = this.props
    const curRowKey = record[rowKey]
    return this.ifHasSubTree() && expandedRowKeys.findIndex((key: number) => key === curRowKey) >= 0
  }
  public getIndentSize = () => {
    const {depth} = this.props
    // const prevRankIndent = (depth - 1) * 40
    if (depth === 0) {
      return 0
    } else if (depth >= 1) {
      // return this.ifHasSubTree() ? 40  :  40 - 18
      // 有子树时要展示收起展开标志，这个标志宽度为18px，无子树时就显示一个gutter，宽度也为18px，为了使顶级导航
      // 以下的二级、三级导航的箭头图标(hassbubtree时)或文件夹/文件图标(无subtree时)的两种图标都与上一级导航的文字
      // 左对齐，因为无子树时多了个18px的gutter，所以需要少indent 18px
      return this.ifHasSubTree() ? 40 * depth  :  40 * (depth - 1) + 40
    }

  }
  // 在文件夹或文件图标前是展示toggle图标还是gutter
  public renderGutterOrIconOfToggleTreeBeforeTreeIcon = () => {
    // const WidthEqualToNavigationTreeIcon = (<span style={{display: 'inline-block', width: 18 }} />)
    const {record, rowKey} = this.props
    let renderElem
    if (!this.ifHasSubTree()) {
      // renderElem = WidthEqualToNavigationTreeIcon
      renderElem = null
    } else {
      if (this.ifShowSubTree()) {
        renderElem = (
          <Icon
            type='caret-down'
            className={styles.navigationTreeIcon}
            onClick={() => {this.props.onExpandChange({expanded: false, record, key: record[rowKey]})}}
          />
        )
      } else {
        renderElem = (
          <Icon
            type='caret-right'
            className={styles.navigationTreeIcon}
            onClick={() => {this.props.onExpandChange({expanded: true, record, key: record[rowKey]})}}
          />
        )
      }
    }
    return renderElem
  }
  public renderFolderFileIcon = () => {
    const {record} = this.props
    return (
      <>
        {
          record.type === 'FOLDER' ?
            <>
              <Icon type='folder' className={styles.folderFileIcon} />
            </> :
            <>
              <Icon type='file' className={styles.folderFileIcon} />
            </>
        }
      </>

    )
  }
  public render() {
    const {
      // isOver,
      connectDragSource,
      connectDropTarget,
      record,
      childrenColumnName,
      expandedRowKeys,
      rowKey,
      // dragRow,
      moverow,
      // initialClientOffset,
      columns,
      depth,
    } = this.props

    return connectDragSource(
      connectDropTarget((
      <div>
        {
            <div
              className={classNames(styles.tableRowWrap)}
            >
              {
                columns.map((column: IColumn, index: number) => {
                  // 要在第0列的td前渲染的东西
                  let renderSthBeforeZeroColCell
                  if (index > 0) {
                    renderSthBeforeZeroColCell = null
                  } else if (index === 0) {
                    renderSthBeforeZeroColCell = (
                      <>
                        {this.renderGutterOrIconOfToggleTreeBeforeTreeIcon()}
                        {this.renderFolderFileIcon()}
                      </>
                    )
                  }
                  // const firColWid = `calc(${1 / columns.length * 100}% - ${this.getIndentSize()}px)`
                  const getColWid = () => {
                    if (column.width) {
                      if (index === 0) {
                        return `calc(${column.width} - ${this.getIndentSize()}px)`
                      } else {
                        return `${column.width}`
                      }
                    } else {
                      if (index === 0) {
                        return `calc(${1 / columns.length * 100}% - ${this.getIndentSize()}px)`
                      } else {
                        return `(${1 / columns.length * 100}%`
                      }
                    }
                  }
                  return (
                    <span
                      key={column.key}
                      className={classNames(
                        // index === 0 ? dragDirection : '',
                        index === 0 ? `firstTdInRow` : '',
                        styles.tableCell,
                        index === 0 ? styles.firstTableCell : '')
                      }
                      style={{
                        width: getColWid(),
                        // 加26是为了使第一列的箭头或文字与列文字左对齐, 若不是第一列则用26让render方法里reactelem的左边与col name左对齐
                        paddingLeft: 16,
                        // 为了使每个tablecell的宽度都是相对于一整行tablerow的宽度，所以在每个tr的第一个td中设置indent，而不是在
                        // tablerow上直接设置marginleft
                        marginLeft: index === 0 ? this.getIndentSize() : '',
                        fontFamily: record.type === 'FOLDER' ? 'PingFangSC-Medium' : 'PingFangSC-Regular',
                      }}
                    >
                      {renderSthBeforeZeroColCell}
                      {
                        index > 0 && column.render ?
                          column.render(record[column.key], record) :
                          <span className={styles.navigationTreeText}>
                            {record[column.key]}
                            {index === 0 && record.nav === 'Y' ?
                              <Icon type={'dh'} style={{marginLeft: 4, color: '#547DFC'}}/> : null
                            }
                            </span>
                      }
                    </span>
                  )
                })
              }
            </div>
        }
        {
          this.ifHasSubTree() && this.ifShowSubTree() ?
            <div >
              {
                record[childrenColumnName].map((elem: any) => (
                  <BodyRow
                    key={elem.id}
                    record={elem}
                    columns={columns}
                    rowKey={rowKey}
                    childrenColumnName={childrenColumnName}
                    depth={depth + 1}
                    expandedRowKeys={expandedRowKeys}
                    onExpandChange={this.props.onExpandChange}
                    moverow={moverow}
                  />
                ))
              }
            </div> : null
        }
      </div>
    )))
  }
}

interface ITableBodyProps {
  data: any[]
  rowKey: string
  childrenColumnName?: string
  columns: IColumn[]
  expandedRowKeys: number[]
  onExpandChange: ({}: IOnExpandChange) => any
  moverow: (...args: any[]) => any
}
export default class TableBody extends React.Component<ITableBodyProps> {
  public renderRows = (data: any, depth?: number) => {
    const {rowKey, columns} = this.props
    const {childrenColumnName = 'childs', expandedRowKeys} = this.props
    return (
      <>
        {
          data && data.length > 0 ? data.map((elem: any) => {
            return (
              <div key={elem[rowKey]}>
                <BodyRow
                  key={elem[rowKey]}
                  record={elem}
                  columns={columns}
                  rowKey={rowKey}
                  childrenColumnName={childrenColumnName}
                  depth={depth}
                  expandedRowKeys={expandedRowKeys}
                  onExpandChange={this.props.onExpandChange}
                  moverow={this.props.moverow}
                />
                {/*<div style={{display: this.ifHasSubTree(elem) && this.ifShowSubTree(elem) ? 'block' : 'none'}}>*/}
                  {/*{*/}
                    {/*this.ifHasSubTree(elem) && this.ifShowSubTree(elem) ?*/}
                      {/*this.renderRows(elem[childrenColumnName], depth + 1) : null*/}
                  {/*}*/}
                {/*</div>*/}

              </div>
            )
          }) : null
        }
      </>
    )
  }
  public render() {
    const {data} = this.props
    return (
      <div>
        {
          data && data.length > 0 ?
            (
              <div className={styles.tableBody}>
                {this.renderRows(data, 0)}
              </div>
            ) :
            <div className={styles.emptyDataRow}>暂无数据</div>
        }
      </div>
    )
  }
}
