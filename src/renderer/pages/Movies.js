import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Empty, Typography, Input, Select, Tag, Space, Dropdown, Button, message, Pagination } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEmbyStore } from '../stores/embyStore';
import { DownOutlined, SearchOutlined } from '@ant-design/icons';
import './Movies.scss';
const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const Movies = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const [movies, setMovies] = useState([]);
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [displayedMovies, setDisplayedMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('ProductionYear,Descending');
    const { getApiClient, token } = useEmbyStore();
    const [serverUrl, setServerUrl] = useState('');
    const { userId } = useEmbyStore();
    const [totalCount, setTotalCount] = useState(0);
    const [libraryName, setLibraryName] = useState('电影');
    // 获取库ID - 可能来自路由参数或location state
    const libraryId = params.id || location.state?.libraryId || null;
    // 分页配置
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0
    });
    // 筛选选项状态
    const [filterOptions, setFilterOptions] = useState({
        years: [],
        genres: [],
        countries: [],
        selectedYear: null,
        selectedGenre: null,
        selectedCountry: null
    });
    useEffect(() => {
        // 初始化服务器URL
        const apiClient = getApiClient();
        if (apiClient?.defaults?.baseURL) {
            setServerUrl(apiClient.defaults.baseURL);
        }
        // 每当sortBy或libraryId变化，重新获取电影列表
        fetchMovies();
    }, [sortBy, libraryId]);
    // 当筛选条件或搜索词变化时，应用筛选
    useEffect(() => {
        if (movies.length > 0) {
            applyFilters();
        }
    }, [movies, filterOptions.selectedYear, filterOptions.selectedGenre, filterOptions.selectedCountry, searchTerm]);
    // 当筛选后的结果或分页变化时，更新显示的电影
    useEffect(() => {
        updateDisplayedMovies();
    }, [filteredMovies, pagination.current, pagination.pageSize]);
    const fetchMovies = async () => {
        setLoading(true);
        try {
            const apiClient = getApiClient();
            const [sortField, sortOrder] = sortBy.split(',');
            // 如果有特定的库ID，则获取该库的信息
            if (libraryId) {
                try {
                    // 直接使用/Items/{id}获取媒体库信息会出现404错误
                    // 改用Views API获取媒体库名称
                    const viewsResponse = await apiClient.get(`/Users/${userId}/Views`);
                    const libraryView = viewsResponse.data?.Items?.find((view) => view.Id === libraryId);
                    if (libraryView && libraryView.Name) {
                        setLibraryName(libraryView.Name);
                    }
                    else {
                        setLibraryName('电影库');
                    }
                }
                catch (error) {
                    console.error('获取媒体库信息失败:', error);
                    setLibraryName('电影库'); // 设置默认名称
                }
            }
            // 构建请求参数，如果有库ID则添加ParentId参数
            const params = {
                SortBy: sortField,
                SortOrder: sortOrder,
                IncludeItemTypes: 'Movie',
                Recursive: true,
                Fields: 'PrimaryImageAspectRatio,BasicSyncInfo,Overview,Genres,CommunityRating,OfficialRating,RunTimeTicks,ProductionLocations',
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop',
                Limit: 200, // 获取更多数据用于本地筛选
            };
            // 如果有指定媒体库，则添加ParentId参数
            if (libraryId) {
                params.ParentId = libraryId;
            }
            const response = await apiClient.get(`/Users/${userId}/Items`, { params });
            const moviesList = response.data.Items || [];
            setMovies(moviesList);
            setTotalCount(response.data.TotalRecordCount || moviesList.length);
            // 提取所有年份、类型和国家，用于筛选
            const years = Array.from(new Set(moviesList
                .filter((movie) => movie.ProductionYear)
                .map((movie) => movie.ProductionYear))).sort((a, b) => {
                if (typeof a === 'number' && typeof b === 'number') {
                    return b - a; // 降序排列年份
                }
                return 0;
            });
            const genres = Array.from(new Set(moviesList
                .filter((movie) => movie.Genres && movie.Genres.length > 0)
                .flatMap((movie) => movie.Genres || []))).sort();
            const countries = Array.from(new Set(moviesList
                .filter((movie) => movie.ProductionLocations && movie.ProductionLocations.length > 0)
                .flatMap((movie) => movie.ProductionLocations || []))).sort();
            setFilterOptions(prev => ({
                ...prev,
                years: years,
                genres: genres,
                countries: countries
            }));
        }
        catch (error) {
            console.error('获取电影列表失败:', error);
            message.error('获取电影列表失败，请检查网络连接');
        }
        finally {
            setLoading(false);
        }
    };
    // 应用所有筛选条件
    const applyFilters = () => {
        let result = [...movies];
        // 应用搜索
        if (searchTerm) {
            result = result.filter(movie => movie.Name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        // 应用年份筛选
        if (filterOptions.selectedYear !== null) {
            result = result.filter(movie => movie.ProductionYear === filterOptions.selectedYear);
        }
        // 应用类型筛选
        if (filterOptions.selectedGenre !== null && filterOptions.selectedGenre !== '') {
            result = result.filter(movie => movie.Genres && movie.Genres.some(genre => genre === filterOptions.selectedGenre));
        }
        // 应用国家筛选
        if (filterOptions.selectedCountry !== null && filterOptions.selectedCountry !== '') {
            result = result.filter(movie => movie.ProductionLocations && movie.ProductionLocations.some(country => country === filterOptions.selectedCountry));
        }
        setFilteredMovies(result);
        // 重置分页到第一页
        setPagination(prev => ({
            ...prev,
            current: 1,
            total: result.length
        }));
    };
    // 更新当前页显示的电影
    const updateDisplayedMovies = () => {
        const { current, pageSize } = pagination;
        const startIndex = (current - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        setDisplayedMovies(filteredMovies.slice(startIndex, endIndex));
    };
    const getImageUrl = (item) => {
        if (item.ImageTags?.Primary) {
            return `${serverUrl}/Items/${item.Id}/Images/Primary?width=300&quality=90&api_key=${token}`;
        }
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iIzJhMmEyYSIgLz48dGV4dCB4PSI3NSIgeT0iMTEyLjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMnB4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
    };
    const handleMovieClick = (item) => {
        navigate(`/player/${item.Id}`);
    };
    // 处理搜索提交
    const handleSearch = (value) => {
        setSearchTerm(value);
    };
    const handleSortChange = (value) => {
        setSortBy(value);
    };
    const handleYearChange = (year) => {
        setFilterOptions(prev => ({
            ...prev,
            selectedYear: year
        }));
    };
    const handleGenreChange = (genre) => {
        setFilterOptions(prev => ({
            ...prev,
            selectedGenre: genre
        }));
    };
    const handleCountryChange = (country) => {
        setFilterOptions(prev => ({
            ...prev,
            selectedCountry: country
        }));
    };
    const clearFilters = () => {
        setFilterOptions(prev => ({
            ...prev,
            selectedYear: null,
            selectedGenre: null,
            selectedCountry: null
        }));
    };
    // 处理分页变化
    const handlePageChange = (page, pageSize) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize: pageSize || prev.pageSize
        }));
    };
    const formatRuntime = (ticks) => {
        if (!ticks)
            return '';
        // Emby使用的是100纳秒为单位的ticks
        const minutes = Math.floor(ticks / (10000 * 1000 * 60));
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (hours > 0) {
            return `${hours}小时${remainingMinutes > 0 ? ` ${remainingMinutes}分钟` : ''}`;
        }
        return `${minutes}分钟`;
    };
    // 渲染已选筛选条件标签
    const renderFilterTags = () => {
        const tags = [];
        if (filterOptions.selectedYear !== null) {
            tags.push(_jsxs(Tag, { closable: true, onClose: () => handleYearChange(null), children: ["\u5E74\u4EFD: ", filterOptions.selectedYear] }, "year"));
        }
        if (filterOptions.selectedGenre) {
            tags.push(_jsxs(Tag, { closable: true, onClose: () => handleGenreChange(null), children: ["\u7C7B\u578B: ", filterOptions.selectedGenre] }, "genre"));
        }
        if (filterOptions.selectedCountry) {
            tags.push(_jsxs(Tag, { closable: true, onClose: () => handleCountryChange(null), children: ["\u56FD\u5BB6/\u5730\u533A: ", filterOptions.selectedCountry] }, "country"));
        }
        return tags.length > 0 ? (_jsxs(Space, { style: { marginTop: 16, marginBottom: 16 }, children: [tags, tags.length > 0 && (_jsx(Button, { size: "small", onClick: clearFilters, children: "\u6E05\u9664\u6240\u6709" }))] })) : null;
    };
    // 年份筛选下拉菜单
    const yearMenu = {
        items: [
            {
                key: 'all',
                label: '全部年份',
                onClick: () => handleYearChange(null)
            },
            ...filterOptions.years.map((year) => ({
                key: year.toString(),
                label: year.toString(),
                onClick: () => handleYearChange(year)
            }))
        ]
    };
    // 类型筛选下拉菜单
    const genreMenu = {
        items: [
            {
                key: 'all',
                label: '全部类型',
                onClick: () => handleGenreChange(null)
            },
            ...filterOptions.genres.map((genre) => ({
                key: genre,
                label: genre,
                onClick: () => handleGenreChange(genre)
            }))
        ]
    };
    // 国家筛选下拉菜单
    const countryMenu = {
        items: [
            {
                key: 'all',
                label: '全部国家/地区',
                onClick: () => handleCountryChange(null)
            },
            ...filterOptions.countries.map((country) => ({
                key: country,
                label: country,
                onClick: () => handleCountryChange(country)
            }))
        ]
    };
    return (_jsxs("div", { className: "movies-page", children: [_jsxs("div", { className: "movies-header", children: [_jsx(Title, { level: 2, children: libraryId ? libraryName : '电影库' }), _jsxs("div", { className: "movies-filter", children: [_jsx(Search, { placeholder: "\u641C\u7D22\u7535\u5F71", allowClear: true, onSearch: handleSearch, style: { width: 250, marginRight: 16 }, enterButton: _jsx(SearchOutlined, {}) }), _jsxs(Select, { defaultValue: sortBy, style: { width: 150 }, onChange: handleSortChange, children: [_jsx(Option, { value: "DateCreated,Descending", children: "\u6700\u8FD1\u6DFB\u52A0" }), _jsx(Option, { value: "SortName,Ascending", children: "\u540D\u79F0 A-Z" }), _jsx(Option, { value: "SortName,Descending", children: "\u540D\u79F0 Z-A" }), _jsx(Option, { value: "ProductionYear,Descending", children: "\u5E74\u4EFD \u65B0-\u65E7" }), _jsx(Option, { value: "ProductionYear,Ascending", children: "\u5E74\u4EFD \u65E7-\u65B0" }), _jsx(Option, { value: "CommunityRating,Descending", children: "\u8BC4\u5206 \u9AD8-\u4F4E" })] })] })] }), _jsxs("div", { className: "filter-section", children: [_jsxs(Space, { size: "middle", children: [_jsx(Dropdown, { menu: yearMenu, disabled: filterOptions.years.length === 0, children: _jsx(Button, { children: _jsxs(Space, { children: ["\u5E74\u4EFD", _jsx(DownOutlined, {})] }) }) }), _jsx(Dropdown, { menu: genreMenu, disabled: filterOptions.genres.length === 0, children: _jsx(Button, { children: _jsxs(Space, { children: ["\u7C7B\u578B", _jsx(DownOutlined, {})] }) }) }), _jsx(Dropdown, { menu: countryMenu, disabled: filterOptions.countries.length === 0, children: _jsx(Button, { children: _jsxs(Space, { children: ["\u56FD\u5BB6/\u5730\u533A", _jsx(DownOutlined, {})] }) }) })] }), renderFilterTags()] }), loading ? (_jsx("div", { className: "loading-container", children: _jsx(Spin, { size: "large" }) })) : displayedMovies.length === 0 ? (_jsx(Empty, { description: "\u6CA1\u6709\u627E\u5230\u7B26\u5408\u6761\u4EF6\u7684\u7535\u5F71" })) : (_jsxs(_Fragment, { children: [_jsx(Row, { gutter: [16, 24], className: "movies-grid", children: displayedMovies.map((movie) => (_jsx(Col, { xs: 12, sm: 8, md: 6, lg: 4, xl: 4, children: _jsx(Card, { hoverable: true, cover: _jsxs("div", { className: "movie-cover-container", children: [_jsx("img", { alt: movie.Name, src: getImageUrl(movie) }), _jsx("div", { className: "movie-overlay", children: _jsx("div", { className: "movie-play-button", children: "\u64AD\u653E" }) }), movie.Genres && movie.Genres.length > 0 && (_jsx("div", { className: "movie-genre-tag", children: movie.Genres[0] }))] }), onClick: () => handleMovieClick(movie), className: "movie-card", children: _jsx(Card.Meta, { title: movie.Name, description: _jsxs("div", { className: "movie-details", children: [_jsx("div", { children: movie.ProductionYear || '未知年份' }), movie.RunTimeTicks && (_jsx("div", { children: formatRuntime(movie.RunTimeTicks) })), movie.OfficialRating && (_jsx("div", { className: "movie-rating", children: movie.OfficialRating }))] }) }) }) }, movie.Id))) }), filteredMovies.length > 0 && (_jsx("div", { className: "pagination-container", children: _jsx(Pagination, { current: pagination.current, pageSize: pagination.pageSize, total: filteredMovies.length, onChange: handlePageChange, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 部电影` }) }))] }))] }));
};
export default Movies;
