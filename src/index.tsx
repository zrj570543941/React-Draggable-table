import React from 'react'
import _ from 'lodash'
import {
  DragDropContext,
} from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import TableHeader from './table-header'
import TableBody from './table-body'
import styles from './index.scss'
import { IOnExpandChange } from './interfaces'
type Direction = 'downward' | 'upward' | 'middle'
export type TableRowDataType = any
// type TableTreeNodeType = any

interface IProps {
  dataSource: any[]
  columns: any[]
  rowKey: string
  childrenColumnName: string
  onDropSuccess?: (changedRows: any[]) => any
}
interface IState {
  data: any[]
  expandedRowKeys: number[]
}
class DraggableTable extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props)
    this.state = {
      data: props.dataSource,
      expandedRowKeys: [],
    }
  }
  public componentWillReceiveProps(nextProps: IProps) {
    if (nextProps.dataSource !== undefined && !(_.isEqual(nextProps.dataSource, this.state.data))) {
      this.setState({
        data: nextProps.dataSource,
      })
    }
  }

  public moverow = (
    {dragRecord, hoverRecord, dragDirection}: {dragRecord: any, hoverRecord: any, dragDirection: Direction },
    ) => {
    // console.log(dragRecord, hoverRecord, dragDirection)
    let data = [...this.state.data]

    // console.log({dragRecord, hoverRecord})

    data = this.delRecordInTreeArray(dragRecord, data).data

    data = this.insertRecordIntoTreeArray(data, dragRecord, hoverRecord, dragDirection).data
    // console.log(data)
    this.setState({data})
  }

  public delRecordInTreeArray = (recordToFind: any, data: any) => {
    // const data = [...this.state.data]
    let isFound = false
    data.forEach((record: any, index: number) => {
      if (record.id === recordToFind.id && !isFound) {
        isFound = true
        data.splice(index, 1)
      }
      if (record.childs && record.childs.length > 0 && !isFound) {
        const obj = this.delRecordInTreeArray(recordToFind, record.childs)
        isFound = obj.isFound
        record.childs = obj.data
      }
    })
    return {
      data,
      isFound,
    }
  }
  // chidrenOfTreeNode：指要查找的treenode的children
  public findRecordInTreeNode = (recordToFind: TableRowDataType, chidrenOfTreeNode: TableRowDataType[]) => {
    let isFound = false
    if (chidrenOfTreeNode && chidrenOfTreeNode.length > 0 && !isFound) {
      chidrenOfTreeNode.forEach((record: any) => {
        if (record.id === recordToFind.id && !isFound) {
          isFound = true
          // data.splice(index, 1)
        }
        if (record.childs && !isFound) {
          const obj = this.findRecordInTreeNode(recordToFind, record.childs)
          isFound = obj.isFound
          // record.childs = obj.data
        }
      })
    }
    return {
      isFound,
    }
  }
  // 暂时保留，若后续要做拖入树中展开树的功能，这块逻辑还会用到
  // noinspection JSUnusedGlobalSymbols
  public togglefolder = (hoverRecord: TableRowDataType, dragRecord: TableRowDataType) => {
    const hoverId = hoverRecord.id
    const keys = this.state.expandedRowKeys
    const hoverIdIndexInExpandedRowKeys = keys.findIndex((key: number) => key === hoverId)
    const isDragRecordFoundInHoverRecord: boolean = this.findRecordInTreeNode(dragRecord, hoverRecord.childs).isFound
    // 当dragRecord不属于hoverRecord的子节点且当前hoverreacord处于关闭状态时，即上一级节点想要拖入某树节点下时，若树关闭要展开树
    if (isDragRecordFoundInHoverRecord === false && hoverIdIndexInExpandedRowKeys === -1) {
      this.setState({
        expandedRowKeys: [...new Set([...keys, hoverId])],
      })
      // 当dragRecord属于hoverRecord的子节点且当前hoverreacord处于打开状态时，即子级节点想要往上一级节点拖时，若树打开要关闭树
    }
    // else if (isDragRecordFoundInHoverRecord === true && hoverIdIndexInExpandedRowKeys >= 0) {
    //   keys.splice(hoverIdIndexInExpandedRowKeys, 1)
    //   this.setState({
    //     expandedRowKeys: keys,
    //   })
    // }

  }
  // 这是应后端要求把每次拖拽时，比如A下面有1 2 3三个节点，B下面有4 5两个节点，当把1 拖到4后面中时，
  // 次序变为了4 1 5，这里把这三个节点的seq做了重新排序，并更新了1的parenid回传给后端
  public dealSeqAndParChgEveryDrop = (allChildren: TableRowDataType[], parentId: number | undefined) => {
    const copiedAllChildren = [...allChildren]
    const {rowKey} = this.props
    const res: any[] = []
    copiedAllChildren.forEach((child: TableRowDataType, index) => {
      res.push({
        id: child[rowKey],
        // 若拖拽到了顶级菜单，传给后端的值为-1
        parentId: parentId === undefined ? -1 : parentId,
        seq: index + 1,
      })
    })
    // console.log(res)
    if (this.props.onDropSuccess) {
      this.props.onDropSuccess(res)

    }
  }
  // recordToInsertAfter: 表示recordToBeInsterted这个数据将要插入到哪个record后或前或下
  // data: 当前操作的children们
  public insertRecordIntoTreeArray(
    data: any, recordToBeInsterted: TableRowDataType,
    recordToInsertAfter: TableRowDataType, insertDirectioin: Direction,
  ) {
    const {childrenColumnName} = this.props
    let isFound = false
    data.forEach((record: TableRowDataType, index: number) => {
      if (record.id === recordToInsertAfter.id && !isFound) {
        isFound = true
        if (insertDirectioin === 'upward') {
          data.splice(index, 0, {
            ...recordToBeInsterted,
            parentId: recordToInsertAfter.parentId ? recordToInsertAfter.parentId : -1,
          })
          this.dealSeqAndParChgEveryDrop(data, recordToInsertAfter.parentId)
        }
        if (insertDirectioin === 'downward') {
          data.splice(index + 1, 0, {
            ...recordToBeInsterted,
            parentId: recordToInsertAfter.parentId ? recordToInsertAfter.parentId : -1,
          })
          this.dealSeqAndParChgEveryDrop(data, recordToInsertAfter.parentId)
        }
        if (insertDirectioin === 'middle') {
          data[index][childrenColumnName] = [...data[index][childrenColumnName],
            {
              ...recordToBeInsterted,
              parentId: data[index].id,
            },
          ]
          this.dealSeqAndParChgEveryDrop(data[index][childrenColumnName], data[index].id)
        }
      }
      if (record.childs && record.childs.length > 0 && !isFound) {
        const obj = this.insertRecordIntoTreeArray(
          record.childs, recordToBeInsterted, recordToInsertAfter, insertDirectioin,
        )
        isFound = obj.isFound
        record.childs = obj.data
      }
    })
    return {
      data,
      isFound,
    }
  }
  public onExpandChange = ({expanded, key}: IOnExpandChange) => {
    const expandedRowKeys = JSON.parse(JSON.stringify(this.state.expandedRowKeys))
    if (expanded) {
      this.setState({
        expandedRowKeys: [...new Set([...expandedRowKeys, key])],
      })
    } else {
      const keyIndexInExpandedRowKeys = expandedRowKeys.findIndex((elem: number) => elem === key)
      expandedRowKeys.splice(keyIndexInExpandedRowKeys, 1)
      this.setState({
        expandedRowKeys,
      })
    }
  }

  public render() {
    const {expandedRowKeys} = this.state
    const {columns, rowKey, childrenColumnName} = this.props
    return (
      <div className={styles.wrap}>
        <TableHeader columns={columns}/>
        <TableBody
          onExpandChange={this.onExpandChange}
          expandedRowKeys={expandedRowKeys}
          data={this.state.data}
          rowKey={rowKey}
          childrenColumnName={childrenColumnName}
          columns={columns}
          moverow={this.moverow}
        />
      </div>

    )
  }
}

export default DragDropContext(HTML5Backend)(DraggableTable)
