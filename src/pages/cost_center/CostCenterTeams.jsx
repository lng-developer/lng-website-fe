import React, {useState, useEffect} from 'react'
import { MdAdd } from 'react-icons/md'
import { getAllTeam } from '../../apis/config'
import { Space, Table, Tag, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';

const CostCenterTeams = () => {
    
    
    const [dataTeams, setDataTeams] = useState();
    const [loading, setLoading] = useState(true)
    const [rowTeam, setRowTeam] = useState([])
    const [rowMem, setRowMem] = useState([])
    const [openMembers, setOpenMembers] = useState(true);
    
    
    const getDataTeams = async () =>{
        try{
            const res = await getAllTeam({ all: true, page: 1, perPage: 100 })
            if(res.status === 200){
                const dataTeam = res.data?.data;
                console.log("Lay data team thanh cong")
                console.log(dataTeam)
                setDataTeams(dataTeam)
                setLoading(false)
            }
            
        } catch(error){
            console.log(error)
        }
        
    }
    useEffect(()=>{
        getDataTeams();
        
    },[])
    useEffect(()=>{
        setRowTeam ( dataTeams?.map((item,idx) => ({
            key: idx,
            name: item.name,
            totalMembers: item.totalMembers,
            action: "delete, create"
        })))
    }, [dataTeams])
    const teamColumns = [
    {
        title: 'Team\'s Name',
        dataIndex: 'name',
        key: 'name',
        render: text => <p>{text}</p>,
    },{
        title: 'Member',
        dataIndex: 'totalMembers',
        key:'total member',
        render: text => <p>{text}</p>,
    },{
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        render: text => <a>{text}</a>,
  }]
  const memColumns = [
    {
        title: 'Member\'s Name',
        dataIndex: 'full_name',
        key: 'member name',
        render: text => <h2>{text}</h2>
    },
    {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        render: text => <h2>{text}</h2>
    },{
        title: 'Role',
        dataIndex: 'role_id',
        key: 'role',
        render: text => <h2>{text}</h2>
    },
  ]
  
     
  return (
    <div className={`fixed top-0 left-64 right-0 z-50 bg-white transition-all duration-300`}>
              <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
                <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
                  Teams Group
                </h1>
                <div className="flex justify-center items-center">
                  <button
                    className="inline-flex gap-1 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10  space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
                    
                  >
                    <MdAdd size={20} color="black" />
                    <span className="text-sm font-medium" style={{ color: 'black' }}>
                      Add Config
                    </span>
                  </button>
                </div>
              </div>
              {loading? <p>Loading...</p> : <Table
               columns={teamColumns} 
               dataSource={rowTeam} 
               expandable={{
                expandedRowRender: (r, index) => (
                      <Table
                        className="no-indent-table product-type"
                        columns={memColumns}
                        dataSource={dataTeams[index]?.members}
                        pagination={true}
                        rowKey="key"
                        style={{ padding: 10 }}
                      />
                    ),
               }}
               />}
              
              
            
    </div>
  )
}

export default CostCenterTeams
