import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Typography } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import MediaLibraries from '../components/MediaLibraries';
import './Libraries.scss';
const { Title } = Typography;
const Libraries = () => {
    return (_jsxs("div", { className: "libraries-page", children: [_jsxs(Title, { level: 2, className: "page-title", children: [_jsx(AppstoreOutlined, {}), " \u5A92\u4F53\u5E93\u6D4F\u89C8"] }), _jsx("p", { className: "page-description", children: "\u5728\u6B64\u9875\u9762\u60A8\u53EF\u4EE5\u6D4F\u89C8\u6240\u6709\u53EF\u7528\u7684Emby\u5A92\u4F53\u5E93\u3002\u70B9\u51FB\u4EFB\u4E00\u5A92\u4F53\u5E93\u5361\u7247\u4EE5\u67E5\u770B\u5176\u4E2D\u7684\u5185\u5BB9\u3002" }), _jsx(MediaLibraries, {})] }));
};
export default Libraries;
