import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Component } from 'react';
import { Alert, Button, Card, Space } from 'antd';
import { useEmbyStore } from '../stores/embyStore';
class ErrorBoundaryClass extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    componentDidCatch(error, errorInfo) {
        console.error('组件错误:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { style: { padding: '20px' }, children: _jsxs(Card, { children: [_jsx(Alert, { message: "\u5E94\u7528\u7A0B\u5E8F\u53D1\u751F\u9519\u8BEF", description: this.state.error?.message || '未知错误', type: "error", showIcon: true }), _jsx("div", { style: { marginTop: '20px', textAlign: 'center' }, children: _jsxs(Space, { children: [_jsx(Button, { type: "primary", onClick: () => this.setState({ hasError: false, error: null }), children: "\u91CD\u8BD5" }), _jsx(Button, { onClick: () => window.location.reload(), children: "\u5237\u65B0\u9875\u9762" })] }) })] }) }));
        }
        return this.props.children;
    }
}
// 连接状态监测组件
const ConnectionMonitor = ({ children }) => {
    const { connectionError, setConnectionError } = useEmbyStore();
    if (connectionError) {
        return (_jsx("div", { style: { padding: '20px' }, children: _jsxs(Card, { children: [_jsx(Alert, { message: "\u8FDE\u63A5\u9519\u8BEF", description: connectionError, type: "error", showIcon: true }), _jsx("div", { style: { marginTop: '20px', textAlign: 'center' }, children: _jsx(Button, { type: "primary", onClick: () => setConnectionError(null), children: "\u786E\u8BA4" }) })] }) }));
    }
    return _jsx(_Fragment, { children: children });
};
// 组合错误边界和连接监测
const ErrorBoundary = ({ children }) => {
    return (_jsx(ErrorBoundaryClass, { children: _jsx(ConnectionMonitor, { children: children }) }));
};
export default ErrorBoundary;
