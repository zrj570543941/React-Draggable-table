import { Component, ReactElement } from 'react'

export interface IColumn {
  key: number | string
  width?: number | string
  dataIndex?: string
  title: string
  render?: (text: string, record: any) => ReactElement<any> | Component
}

export interface IOnExpandChange {
  expanded: boolean
  record: any
  key: number
}
