import * as ReactDOM from 'react-dom'
import App from './src'

ReactDOM.render((
  <App
    columns={
      [{
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        width: '60%',
      }, {
        title: '操作',
        dataIndex: 'operation',
        width: '40%',
        key: 'operation',
        render: (text: string, record: any, index: number) => {
          return <a href='javascript:;'>caozuo</a>
        },
      }]
    }
    dataSource={[{
      childs: [{
        childs: [],
        fileName: 'user-list',
        hide: 0,
        id: 5,
        name: '用户列表',
        parentId: 3,
        applicationId: 1,
        type: 'PAGE',
      },
        {
          childs: [],
          hide: 0,
          id: 6,
          name: '添加用户',
          parentId: 3,
          applicationId: 1,
          type: 'FOLDER',
        },
      ],
      hide: 0,
      id: 3,
      name: '用户管理',
      applicationId: 1,
      type: 'FOLDER',
    },
      {
        childs: [{
          childs: [],
          hide: 0,
          id: 8,
          name: '添加商品',
          parentId: 7,
          applicationId: 1,
          type: 'FOLDER',
        }],
        hide: 0,
        id: 7,
        name: '商品管理',
        applicationId: 1,
        type: 'FOLDER',
      },
    ]}
    rowKey={'id'}
    childrenColumnName={'childs'}
  />), document.getElementById('app'))
