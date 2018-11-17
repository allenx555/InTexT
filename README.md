# InTexT

InTexT is an intelligent text editor by JoTang.

## 开发环境

建议先安装 [yarn](https://yarnpkg.com/zh-Hans/docs/install) 作为包管理器。

### 运行

```bash
git clone
cd intext
yarn
yarn dev
```

### 用 Prettier 进行代码格式化

为了避免转换代码风格的痛苦，我们用 Prettier 取代 ESlint，你可以按照自己的风格来编写代码，然后按下魔法按钮：`alt` + `shift` + `f`。

#### 与编辑器集成

Visual Studio Code

在 VSCode 的插件商店中搜索 Prettier 并安装。由于目前没有上 ESlint，建议在当前工作区禁用其他 Linter。

其他编辑器

见 Prettier 文档：https://prettier.io/docs/en/editors.html