import React from 'react'
import styles from './table-header.scss'
import { IColumn } from './interfaces'

interface IProps {
  columns: IColumn[]
}
export default (props: IProps) => {
  const {columns} = props
  return (
    <div className={styles.tableHeaderRow}>
      {
        columns.map((column: IColumn) => (
          <span
            className={styles.tableHeader}
            key={column.key}
            style={{display: 'inline-block', width: column.width || `${1 / columns.length * 100}` + `%`}}
          >
            {column.title}
          </span>
        ))
      }
    </div>
  )
}
