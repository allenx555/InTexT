import React from "react";
import { Button, Menu, Icon, Dropdown } from "antd";
import { NavLink } from "react-router-dom";
import "../assets/editor-header.scss";

export default class Header extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const exportMenu = (
      <Menu>
        <Menu.Item key="HTML">导出为 HTML</Menu.Item>
        <Menu.Item key="Markdown">导出为 Markdown</Menu.Item>
        <Menu.Item key="DOC">导出为 DOC</Menu.Item>
        <Menu.Item key="PDF">导出为 PDF</Menu.Item>
      </Menu>
    );
    return (
      <div className="header-bar">
        <span className="header-button-left">
          <NavLink to="/home">
            <Button shape="circle" icon="left" />
          </NavLink>
          <Dropdown overlay={exportMenu} placement="topLeft">
            <Button shape="circle" icon="export" />
          </Dropdown>
        </span>
        <span className="header-title">{this.props.note_title}</span>
        {/* <span className="header-button-right">
          <Button
            type="primary"
            loading={this.state.loading}
            onClick={this.enterLoading}
          >
            Check
          </Button>
        </span> */}
      </div>
    );
  }
}