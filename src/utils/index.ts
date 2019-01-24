import { TableRowDataType } from '../index'

export const findRecordInTreeNode = (recordToFind: TableRowDataType, chidrenOfTreeNode: TableRowDataType[]) => {
  let isFound = false
  if (chidrenOfTreeNode && chidrenOfTreeNode.length > 0 && !isFound) {
    chidrenOfTreeNode.forEach((record: any, index: number) => {
      if (record.id === recordToFind.id && !isFound) {
        isFound = true
        // data.splice(index, 1)
      }
      if (record.childs && !isFound) {
        const obj = findRecordInTreeNode(recordToFind, record.childs)
        isFound = obj.isFound
        // record.childs = obj.data
      }
    })
  }
  return {
    isFound,
  }
}

// export const rmAndAddOnlyOneDirectionClassname = ()
