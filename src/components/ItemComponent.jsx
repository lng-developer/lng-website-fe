import { Menu } from 'antd';
import { Link } from 'react-router-dom';

const ItemComponent = ({ icon, title = '', link = '' }) => {
  return (
    <Menu.Item key={link}>
      <Link to={link}>
        <div className="flex gap-3 items-center px-2">
          {icon}
          <span className="font-medium text-base">{title}</span>
        </div>
      </Link>
    </Menu.Item>
  );
};

export default ItemComponent;
