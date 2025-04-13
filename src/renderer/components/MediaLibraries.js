import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Card, Row, Col, Spin, Empty, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { AppstoreOutlined } from '@ant-design/icons';
import { useMediaLibraryStore } from '../stores/mediaLibraryStore';
import { useEmbyStore } from '../stores/embyStore';
import './MediaLibraries.scss';
const { Title } = Typography;
const MediaLibraries = () => {
    const navigate = useNavigate();
    const { libraries, isLoading, error, fetchLibraries, getLibraryImageUrl } = useMediaLibraryStore();
    const { isLoggedIn } = useEmbyStore();
    // 当用户登录状态变化时，获取媒体库列表
    useEffect(() => {
        if (isLoggedIn) {
            fetchLibraries();
        }
    }, [isLoggedIn, fetchLibraries]);
    const handleLibraryClick = (library) => {
        // 根据媒体库类型导航到不同页面
        switch (library.CollectionType) {
            case 'movies':
                navigate('/movies', { state: { libraryId: library.Id } });
                break;
            case 'tvshows':
                navigate('/series', { state: { libraryId: library.Id } });
                break;
            default:
                // 对于其他类型，可以先导航到通用页面或当前还不支持的提示
                message.info(`暂不支持 ${library.Name} (${library.CollectionType || '未知类型'}) 类型的媒体库浏览`);
                break;
        }
    };
    if (!isLoggedIn) {
        return (_jsx("div", { className: "media-libraries-container", children: _jsx(Empty, { description: "\u8BF7\u5148\u767B\u5F55\u4EE5\u67E5\u770B\u5A92\u4F53\u5E93" }) }));
    }
    if (isLoading) {
        return (_jsx("div", { className: "media-libraries-container loading", children: _jsx(Spin, { size: "large", tip: "\u52A0\u8F7D\u4E2D..." }) }));
    }
    if (error) {
        return (_jsx("div", { className: "media-libraries-container error", children: _jsx(Empty, { description: error }) }));
    }
    if (libraries.length === 0) {
        return (_jsx("div", { className: "media-libraries-container empty", children: _jsx(Empty, { description: "\u6CA1\u6709\u53EF\u7528\u7684\u5A92\u4F53\u5E93" }) }));
    }
    return (_jsxs("div", { className: "media-libraries-container", children: [_jsxs(Title, { level: 4, className: "section-title", children: [_jsx(AppstoreOutlined, {}), " \u5A92\u4F53\u5E93"] }), _jsx(Row, { gutter: [16, 16], className: "libraries-grid", children: libraries.map(library => (_jsx(Col, { xs: 12, sm: 8, md: 6, lg: 6, xl: 4, children: _jsx(Card, { hoverable: true, cover: _jsxs("div", { className: "library-card-cover", children: [_jsx("img", { alt: library.Name, src: getLibraryImageUrl(library), className: "library-image" }), _jsx("div", { className: "library-type-badge", children: library.CollectionType })] }), className: "library-card", onClick: () => handleLibraryClick(library), children: _jsx(Card.Meta, { title: library.Name, description: `${library.CollectionType || '未知类型'}` }) }) }, library.Id))) })] }));
};
export default MediaLibraries;
