import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Empty, Typography, Input, Select, Tag, Space, Dropdown, Button, message, Pagination } from 'antd';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEmbyStore } from '../stores/embyStore';
import { DownOutlined, SearchOutlined } from '@ant-design/icons';
import './Series.scss';
const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const Series = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const [seriesList, setSeriesList] = useState([]);
    const [filteredSeries, setFilteredSeries] = useState([]);
    const [displayedSeries, setDisplayedSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('SortName,Ascending');
    const { getApiClient, userId, token } = useEmbyStore();
    const [serverUrl, setServerUrl] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [libraryName, setLibraryName] = useState('剧集');
    const [processedSeriesId, setProcessedSeriesId] = useState(null);
    // 获取库ID - 可能来自路由参数或location state
    const libraryId = params.id || location.state?.libraryId || null;
    // 分页配置
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 18,
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
        // 每当sortBy或libraryId变化，重新获取剧集列表
        fetchSeries();
    }, [sortBy, libraryId]);
    // 添加一个新的useEffect来处理直接访问特定系列的情况
    useEffect(() => {
        // 如果有ID参数且尚未处理过该ID，表示需要查看特定剧集的详情
        if (params.id && params.id !== processedSeriesId && !loading && seriesList.length > 0) {
            // 先标记该ID为已处理，防止重复处理
            setProcessedSeriesId(params.id);
            // 查找当前列表中匹配的剧集
            const selectedSeries = seriesList.find(series => series.Id === params.id);
            if (selectedSeries) {
                // 如果找到匹配的剧集，则自动触发点击操作
                console.log(`找到匹配的剧集: ${selectedSeries.Name}，准备获取季和剧集信息`);
                handleSeriesClick(selectedSeries);
            }
            else {
                // 如果当前列表中没有找到，尝试单独获取该剧集信息
                fetchSingleSeries(params.id);
            }
        }
    }, [params.id, processedSeriesId, loading, seriesList]);
    // 当搜索词变化时，过滤剧集
    useEffect(() => {
        if (seriesList.length > 0) {
            applyFilters();
        }
    }, [seriesList, searchTerm]);
    // 当过滤后的结果或分页变化时，更新显示的剧集
    useEffect(() => {
        updateDisplayedSeries();
    }, [filteredSeries, pagination.current, pagination.pageSize]);
    // 添加一个单独的useEffect来监测params.id的变化并重置处理状态
    useEffect(() => {
        // 当URL中的ID参数变化时，重置处理状态
        if (params.id !== processedSeriesId) {
            setProcessedSeriesId(null);
        }
    }, [params.id]);
    const fetchSeries = async () => {
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
                        setLibraryName('剧集库');
                    }
                }
                catch (error) {
                    console.error('获取媒体库信息失败:', error);
                    setLibraryName('剧集库'); // 设置默认名称
                }
            }
            // 构建请求参数
            const params = {
                SortBy: sortField,
                SortOrder: sortOrder,
                IncludeItemTypes: 'Series',
                Recursive: true,
                Fields: 'PrimaryImageAspectRatio,BasicSyncInfo,Overview,Genres,CommunityRating,Status',
                ImageTypeLimit: 1,
                EnableImageTypes: 'Primary,Backdrop',
                Limit: 200,
            };
            // 如果有指定媒体库，则添加ParentId参数
            if (libraryId) {
                params.ParentId = libraryId;
            }
            const response = await apiClient.get(`/Users/${userId}/Items`, { params });
            const seriesList = response.data.Items || [];
            setSeriesList(seriesList);
            setTotalCount(response.data.TotalRecordCount || seriesList.length);
            // 提取所有年份、类型和国家，用于筛选
            const years = Array.from(new Set(seriesList
                .filter((series) => series.ProductionYear)
                .map((series) => series.ProductionYear))).sort((a, b) => {
                if (typeof a === 'number' && typeof b === 'number') {
                    return b - a; // 降序排列年份
                }
                return 0;
            });
            const genres = Array.from(new Set(seriesList
                .filter((series) => series.Genres && series.Genres.length > 0)
                .flatMap((series) => series.Genres || []))).sort();
            const countries = Array.from(new Set(seriesList
                .filter((series) => series.ProductionLocations && series.ProductionLocations.length > 0)
                .flatMap((series) => series.ProductionLocations || []))).sort();
            setFilterOptions(prev => ({
                ...prev,
                years: years,
                genres: genres,
                countries: countries
            }));
        }
        catch (error) {
            console.error('获取剧集列表失败:', error);
            message.error('获取剧集列表失败，请检查网络连接');
        }
        finally {
            setLoading(false);
        }
    };
    // 添加获取单个剧集信息的函数
    const fetchSingleSeries = async (id) => {
        try {
            console.log(`正在获取剧集ID: ${id} 的详细信息`);
            const apiClient = getApiClient();
            // 获取特定剧集的详细信息
            const response = await apiClient.get(`/Users/${userId}/Items/${id}`, {
                params: {
                    Fields: 'PrimaryImageAspectRatio,BasicSyncInfo,Overview,Genres,CommunityRating,Status'
                }
            });
            if (response.data && response.data.Type === 'Series') {
                // 找到了剧集，直接处理
                console.log(`成功获取剧集: ${response.data.Name}，准备获取季和剧集信息`);
                handleSeriesClick(response.data);
            }
            else {
                console.error('无法找到指定的剧集或返回的不是剧集类型');
                message.error('无法找到指定的剧集');
            }
        }
        catch (error) {
            console.error('获取特定剧集信息失败:', error);
            message.error('获取剧集信息失败，请检查网络连接');
        }
    };
    // 应用所有筛选条件
    const applyFilters = () => {
        let result = [...seriesList];
        // 应用搜索
        if (searchTerm) {
            result = result.filter(series => series.Name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        // 应用年份筛选
        if (filterOptions.selectedYear !== null) {
            result = result.filter(series => series.ProductionYear === filterOptions.selectedYear);
        }
        // 应用类型筛选
        if (filterOptions.selectedGenre !== null && filterOptions.selectedGenre !== '') {
            result = result.filter(series => series.Genres && series.Genres.some(genre => genre === filterOptions.selectedGenre));
        }
        // 应用国家筛选
        if (filterOptions.selectedCountry !== null && filterOptions.selectedCountry !== '') {
            result = result.filter(series => series.ProductionLocations && series.ProductionLocations.some(country => country === filterOptions.selectedCountry));
        }
        setFilteredSeries(result);
        // 重置分页到第一页
        setPagination(prev => ({
            ...prev,
            current: 1,
            total: result.length
        }));
    };
    // 更新当前页显示的剧集
    const updateDisplayedSeries = () => {
        const { current, pageSize } = pagination;
        const startIndex = (current - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        setDisplayedSeries(filteredSeries.slice(startIndex, endIndex));
    };
    const getImageUrl = (item) => {
        if (item.ImageTags?.Primary) {
            return `${serverUrl}/Items/${item.Id}/Images/Primary?width=300&quality=90&api_key=${token}`;
        }
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iIzJhMmEyYSIgLz48dGV4dCB4PSI3NSIgeT0iMTEyLjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMnB4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
    };
    const handleSeriesClick = async (item) => {
        try {
            setLoading(true);
            const apiClient = getApiClient();
            console.log(`获取剧集系列 ${item.Name} (ID: ${item.Id}) 的第一季...`);
            // 获取该系列的所有季 - 修正API调用
            const seasonsResponse = await apiClient.get(`/Shows/${item.Id}/Seasons`, {
                params: {
                    userId,
                    Fields: 'ItemCounts,ChildCount', // 添加字段以获取更多信息
                    SortBy: 'SortName', // 按名称排序
                    SortOrder: 'Ascending' // 升序
                }
            });
            console.log('API响应 - 季节数据:', seasonsResponse.data);
            if (seasonsResponse.data && seasonsResponse.data.Items && seasonsResponse.data.Items.length > 0) {
                // 按季号排序
                const seasons = seasonsResponse.data.Items
                    .filter((season) => season.Type === 'Season') // 确保只处理季类型
                    .sort((a, b) => (a.IndexNumber || 0) - (b.IndexNumber || 0));
                if (seasons.length === 0) {
                    console.error('未找到有效的季数据');
                    message.error('此剧集没有有效的季数据');
                    setLoading(false);
                    return;
                }
                const firstSeason = seasons[0];
                console.log(`获取第一季 ${firstSeason.Name} (ID: ${firstSeason.Id}) 的剧集...`);
                // 获取第一季的所有剧集 - 修正API调用
                const episodesResponse = await apiClient.get(`/Users/${userId}/Items`, {
                    params: {
                        ParentId: firstSeason.Id, // 使用季的ID作为父ID
                        Fields: 'Overview,PremiereDate',
                        IncludeItemTypes: 'Episode', // 只包含剧集类型
                        Recursive: true,
                        SortBy: 'SortName,PremiereDate', // 按名称和首播日期排序
                        SortOrder: 'Ascending' // 升序
                    }
                });
                console.log('API响应 - 剧集数据:', episodesResponse.data);
                if (episodesResponse.data && episodesResponse.data.Items && episodesResponse.data.Items.length > 0) {
                    // 按集号排序
                    const episodes = episodesResponse.data.Items
                        .filter((episode) => episode.Type === 'Episode') // 确保只处理剧集类型
                        .sort((a, b) => (a.IndexNumber || 0) - (b.IndexNumber || 0));
                    if (episodes.length === 0) {
                        console.error('未找到有效的剧集');
                        message.error('未找到任何可播放的剧集');
                        setLoading(false);
                        return;
                    }
                    const firstEpisode = episodes[0];
                    console.log(`准备播放第一集: ${firstEpisode.Name} (ID: ${firstEpisode.Id})`);
                    // 导航到第一集
                    navigate(`/player/${firstEpisode.Id}`);
                    setLoading(false);
                    return;
                }
                else {
                    console.error('未找到第一季的任何剧集', episodesResponse);
                    message.error('未找到任何可播放的剧集');
                }
            }
            else {
                console.error('未找到任何季', seasonsResponse);
                message.error('未找到任何可播放的季');
            }
            setLoading(false);
        }
        catch (error) {
            console.error('获取剧集信息失败:', error);
            message.error('获取剧集信息失败，请稍后重试');
            setLoading(false);
        }
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
    return (_jsxs("div", { className: "series-container", children: [_jsxs("div", { className: "series-header", children: [_jsx(Title, { level: 2, children: libraryId ? libraryName : '剧集库' }), _jsxs("div", { className: "series-actions", children: [_jsx(Search, { placeholder: "\u641C\u7D22\u5267\u96C6", allowClear: true, onSearch: handleSearch, style: { width: 250, marginRight: 16 }, enterButton: _jsx(SearchOutlined, {}) }), _jsxs(Select, { defaultValue: sortBy, style: { width: 150 }, onChange: handleSortChange, children: [_jsx(Option, { value: "DateCreated,Descending", children: "\u6700\u8FD1\u6DFB\u52A0" }), _jsx(Option, { value: "SortName,Ascending", children: "\u540D\u79F0 A-Z" }), _jsx(Option, { value: "SortName,Descending", children: "\u540D\u79F0 Z-A" }), _jsx(Option, { value: "ProductionYear,Descending", children: "\u5E74\u4EFD \u65B0-\u65E7" }), _jsx(Option, { value: "ProductionYear,Ascending", children: "\u5E74\u4EFD \u65E7-\u65B0" }), _jsx(Option, { value: "CommunityRating,Descending", children: "\u8BC4\u5206 \u9AD8-\u4F4E" })] })] })] }), _jsxs("div", { className: "filter-section", children: [_jsxs(Space, { size: "middle", children: [_jsx(Dropdown, { menu: yearMenu, disabled: filterOptions.years.length === 0, children: _jsx(Button, { children: _jsxs(Space, { children: ["\u5E74\u4EFD", _jsx(DownOutlined, {})] }) }) }), _jsx(Dropdown, { menu: genreMenu, disabled: filterOptions.genres.length === 0, children: _jsx(Button, { children: _jsxs(Space, { children: ["\u7C7B\u578B", _jsx(DownOutlined, {})] }) }) }), _jsx(Dropdown, { menu: countryMenu, disabled: filterOptions.countries.length === 0, children: _jsx(Button, { children: _jsxs(Space, { children: ["\u56FD\u5BB6/\u5730\u533A", _jsx(DownOutlined, {})] }) }) })] }), renderFilterTags()] }), loading ? (_jsx("div", { className: "loading-container", children: _jsx(Spin, { size: "large" }) })) : displayedSeries.length === 0 && libraryId === undefined ? (_jsx(Empty, { description: "\u6CA1\u6709\u627E\u5230\u7B26\u5408\u6761\u4EF6\u7684\u5267\u96C6" })) : (_jsxs(_Fragment, { children: [_jsx(Row, { gutter: [16, 24], className: "series-grid", children: displayedSeries.map((series) => (_jsx(Col, { xs: 12, sm: 8, md: 6, lg: 4, xl: 4, children: _jsx(Card, { hoverable: true, cover: _jsxs("div", { className: "series-cover-container", children: [_jsx("img", { alt: series.Name, src: getImageUrl(series) }), _jsx("div", { className: "series-overlay", children: _jsx("div", { className: "series-play-button", children: "\u64AD\u653E" }) }), series.Genres && series.Genres.length > 0 && (_jsx("div", { className: "series-genre-tag", children: series.Genres[0] }))] }), onClick: () => handleSeriesClick(series), className: "series-card", children: _jsx(Card.Meta, { title: series.Name, description: _jsxs("div", { className: "series-details", children: [_jsxs("div", { children: [series.ProductionYear || '未知年份', series.Status === 'Continuing' && ' · 连载中'] }), series.ChildCount !== undefined && (_jsxs("div", { children: [series.ChildCount, "\u5B63"] })), series.OfficialRating && (_jsx("div", { className: "series-rating", children: series.OfficialRating }))] }) }) }) }, series.Id))) }), filteredSeries.length > 0 && (_jsx("div", { className: "pagination-container", children: _jsx(Pagination, { current: pagination.current, pageSize: pagination.pageSize, total: filteredSeries.length, onChange: handlePageChange, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 部剧集` }) }))] }))] }));
};
export default Series;
