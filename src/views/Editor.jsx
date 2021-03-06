import React from "react";
import {
  Editor,
  EditorState,
  convertToRaw,
  convertFromRaw,
  RichUtils,
  CompositeDecorator
} from "draft-js";
import { generateNoteID } from "../utils/id";
import localforage from "localforage";
//import LoginState from "../store/LoginStateStore";
import languagetool from "languagetool-api";
import { APIClient } from "../utils/client";
import { Button, Menu, Icon, Dropdown, Popover } from "antd";
import { NavLink } from "react-router-dom";
import "../assets/Editor.scss";
import "../assets/editor-header.scss";
import cookie from "react-cookies";

// 根据错误的文本找到其错误详情
function findProblemByText(wrongText, problemList) {
  for (let i = 0; i < problemList.length; i++) {
    console.log(problemList[i]);
    if (problemList[i].wrongText === wrongText) {
      return problemList[i];
    }
  }
}
export default class EditorPage extends React.Component {
  constructor() {
    super();
    this.state = {
      note_title: "无标题", // 文章标题
      template: "默认", // 文章模板
      global_id: "", // 文章的全局ID
      author: cookie.load("username"), // 文章作者
      editorState: EditorState.createEmpty(this.compositeDecorator), // 初始化文章内容
      loading: false, // TODO: 文章加载状态
      language: "zh-CN", // 文章模板语言
      spellCheck: true, // 是否开启拼写检查
      problemList: [] // 拼写检查结果
    };
    this.titleRef = React.createRef();
    this.contentRef = React.createRef();
    // 复合装饰器
    this.compositeDecorator = new CompositeDecorator([
      {
        strategy: this.spellCheckStrategy,
        component: props => {
          const problem = findProblemByText(
            props.decoratedText,
            this.state.problemList
          );
          const popContent = (
            <>
              <p>{problem.message}</p>
              <a>
                {problem.replacements[0]
                  ? `替换为 ${problem.replacements[0].value}`
                  : "无修改建议"}
              </a>
            </>
          );
          console.log("props", props);
          return (
            <Popover
              content={popContent}
              title={`${problem.type}: ${problem.wrongText}`}
            >
              <span className="warning-text">{props.children}</span>
            </Popover>
          );
        }
      }
    ]);
  }

  componentDidMount() {
    if (this.props.location.state.hasOwnProperty("global_id")) {
      // 如果 URL 带文章ID，则读取本地存储
      // TODO: 判断本地文章是否为最新，否则从后台同步文章
      this.setState(
        {
          note_title:
            this.props.location.state.note_title || this.state.note_title,
          global_id: this.props.location.state.global_id,
          template: this.props.location.state.template
        },
        () => {
          console.log("打开文章", this.state.global_id);
          console.log("文章类型：", this.state.template);
          this.getContentFromLocal();
        }
      );
    } else {
      // 否则创建新文章
      this.setState(
        {
          global_id: generateNoteID(),
          template: this.props.location.state.template
        },
        () => {
          console.log("初始化新文章", this.state.global_id);
          console.log("文章类型：", this.state.template);
          APIClient.post("/note/create", {
            global_id: this.state.global_id,
            template: this.state.template,
            note_title: this.state.note_title,
            author: this.state.author
          });
        }
      );
    }
    // 土办法判断文章模板语言
    if (this.props.location.state.template.startsWith("En")) {
      this.setState({
        language: "en-US"
      });
    } else if (this.props.location.state.template.startsWith("中")) {
      this.setState({
        language: "zh-CN"
      });
    }
  }
  // 根据文章 ID 从本地存储拉取文章
  getContentFromLocal = () => {
    // console.log("this.state.global_id:", this.state.global_id);
    localforage.getItem(this.state.global_id).then(value => {
      this.setState({
        editorState: EditorState.createWithContent(
          convertFromRaw(JSON.parse(value)),
          this.compositeDecorator
        )
      });
    });
  };
  // 保存文章到本地存储
  saveContentToLocal = content => {
    localforage.setItem(
      this.state.global_id,
      JSON.stringify(convertToRaw(content))
    );
  };
  // 获取文章文本内容
  getSentenceFromEditor = () => {
    const text = this.state.editorState.getCurrentContent().getPlainText();
    return text;
  };

  setCompositeDecorator = () => {
    if (this.state.spellCheck) {
      this.setState({
        editorState: EditorState.set(this.state.editorState, {
          decorator: this.compositeDecorator
        })
      });
    } else {
      this.setState({
        // 使用 null 删除所有装饰器
        editorState: EditorState.set(this.state.editorState, {
          decorator: null
        })
      });
    }
  };
  // 根据 toolMenu 的菜单项 key 触发事件
  handleToolMenuClick = ({ key }) => {
    if (key === "SPELLCHECK") {
      this.setState(
        { spellCheck: !this.state.spellCheck },
        this.setCompositeDecorator
      );
    }
  };
  // 同步文章标题更改
  handleTitleChange = e => {
    this.setState({ note_title: e.target.value }, () => {
      APIClient.post("/note/update", {
        global_id: this.state.global_id,
        note_title: this.state.note_title
      });
    });
  };
  // 输入标题后回车会跳转到正文
  handleTitleKeyCommand = command => {
    if (command.keyCode == 13) {
      // Enter: 13
      const content = this.contentRef.current;
      content.focus();
    }
  };
  // 编辑器响应内容更改
  handleKeyCommand = command => {
    const newState = RichUtils.handleKeyCommand(
      this.state.editorState,
      command
    );
    if (newState) {
      this.onChange(newState);
      return "handled";
    }
    return "not-handled";
  };
  onChange = editorState => {
    const contentState = editorState.getCurrentContent();
    this.saveContentToLocal(contentState);
    this.setState({
      editorState
    });
  };
  // 触发拼写检查
  requestSpellCheck = () => {
    const sentences = this.getSentenceFromEditor();
    // console.log("getSentenceFromEditor:", sentences);
    languagetool.check(
      { language: this.state.language, text: sentences },
      (err, res) => {
        if (err) {
          console.log("error from languagetool:", err);
        } else {
          console.log("response from languagetool:", res);
          let results = [];
          res.matches.map(match => {
            const result = {
              from: match.offset,
              to: match.offset + match.length,
              type: match.rule.category.name,
              message: match.message,
              shortMessage: match.shortMessage,
              replacements: match.replacements,
              wrongText: match.context.text.slice(
                match.context.offset,
                match.context.offset + match.context.length
              )
            };
            results.push(result);
          });
          console.log("problemList: ", results);
          this.setState({
            problemList: results
          });
        }
      }
    );
  };
  // 拼写检查装饰器策略函数
  spellCheckStrategy = (contentBlock, callback, contentState) => {
    if (this.state.problemList) {
      this.state.problemList.forEach(problem => {
        callback(problem.from, problem.to);
      });
    }
  };

  render() {
    const exportMenu = (
      <Menu>
        <Menu.Item key="HTML">导出为 HTML</Menu.Item>
        <Menu.Item key="Markdown">导出为 Markdown</Menu.Item>
        <Menu.Item key="DOC">导出为 DOC</Menu.Item>
        <Menu.Item key="PDF">导出为 PDF</Menu.Item>
      </Menu>
    );

    const toolMenu = (
      <Menu onClick={this.handleToolMenuClick}>
        <Menu.Item key="SPELLCHECK">
          {this.state.spellCheck ? (
            <>
              <Icon type="check" />
              <span>智能纠错</span>
            </>
          ) : (
            <span>智能纠错</span>
          )}
        </Menu.Item>
        <Menu.Item disabled>智能建议</Menu.Item>
      </Menu>
    );

    return (
      <div>
        <div className="header-bar">
          <span className="header-button-left">
            <NavLink to="/home">
              <Button shape="circle" icon="left" />
            </NavLink>
            <Dropdown overlay={exportMenu} placement="topLeft">
              <Button shape="circle" icon="export" />
            </Dropdown>
            <Dropdown overlay={toolMenu} placement="topLeft">
              <Button shape="circle" icon="tool" />
            </Dropdown>
            <Button
              shape="circle"
              icon="check"
              onClick={this.requestSpellCheck}
            />
          </span>
          <span className="header-title">{this.state.note_title}</span>
        </div>

        <div className="editor-area">
          <div className="editor-assistant" />
          <div className="editor-content">
            <div className="editor-title-box">
              <input
                ref={this.titleRef}
                className="editor-title"
                value={this.state.note_title}
                placeholder="无标题"
                onChange={this.handleTitleChange}
                onKeyUp={this.handleTitleKeyCommand}
              />
            </div>
            <Editor
              ref={this.contentRef}
              editorState={this.state.editorState}
              handleKeyCommand={this.handleKeyCommand}
              onChange={this.onChange}
            />
          </div>
        </div>
      </div>
    );
  }
}
