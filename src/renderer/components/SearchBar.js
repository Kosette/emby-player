import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Input, AutoComplete, Spin, Avatar, Empty, message } from 'antd';
import { SearchOutlined, FileImageOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEmbyStore } from '../stores/embyStore';
import './SearchBar.scss';
const SearchBar = () => {
    const [value, setValue] = useState('');
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const { getApiClient, serverUrl, userId, token } = useEmbyStore();
    const navigate = useNavigate();
    const searchMedia = async (query) => {
        if (!query || query.length < 2) {
            setOptions([]);
            return;
        }
        setLoading(true);
        try {
            const apiClient = getApiClient();
            const response = await apiClient.get(`/Users/${userId}/Items`, {
                params: {
                    SearchTerm: query,
                    IncludeItemTypes: 'Movie,Series,Episode',
                    Recursive: true,
                    Fields: 'PrimaryImageAspectRatio,Overview,ProviderIds,DateCreated,PremiereDate,SeriesInfo,SeasonInfo',
                    Limit: 10,
                    SortBy: 'SortName,DateCreated',
                    SortOrder: 'Ascending,Descending',
                    EnableImageTypes: 'Primary'
                },
            });
            const results = response.data.Items || [];
            console.log('搜索结果:', results);
            const formattedOptions = results.map((item) => ({
                value: item.Id,
                item: item,
                label: (_jsxs("div", { className: "search-item", children: [_jsx(Avatar, { size: 45, shape: "square", src: item.ImageTags?.Primary ? `${serverUrl}/Items/${item.Id}/Images/Primary?api_key=${token}` : undefined, icon: !item.ImageTags?.Primary && _jsx(FileImageOutlined, {}), style: { borderRadius: '4px' } }), _jsxs("div", { className: "search-item-details", children: [_jsx("div", { className: "search-item-title", children: item.Type === 'Episode' ?
                                        `${item.SeriesName} - ${item.SeasonName ? `${item.SeasonName} ` : ''}${item.IndexNumber ? `第${item.IndexNumber}集` : item.Name}`
                                        : item.Name }), _jsxs("div", { className: "search-item-subtitle", children: [item.Type === 'Movie' && (_jsxs(_Fragment, { children: ["\u7535\u5F71 ", item.ProductionYear ? `(${item.ProductionYear})` : ''] })), item.Type === 'Series' && (_jsxs(_Fragment, { children: ["\u5267\u96C6 ", item.ProductionYear ? `(${item.ProductionYear})` : ''] })), item.Type === 'Episode' && (_jsxs(_Fragment, { children: ["\u5267\u96C6 - ", item.Name] }))] })] }), _jsx(PlayCircleOutlined, { className: "search-item-play" })] })),
            }));
            setOptions(formattedOptions);
        }
        catch (error) {
            console.error('搜索失败:', error);
            setOptions([{
                    value: 'error',
                    item: { Id: 'error', Name: '搜索失败', Type: 'Error' },
                    label: _jsx("div", { className: "search-item-error", children: "\u641C\u7D22\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5" })
                }]);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSearch = (searchText) => {
        setValue(searchText);
        searchMedia(searchText);
    };
    const handleSelect = async (id, option) => {
        if (id === 'error') {
            message.error('搜索遇到错误，请重试');
            return;
        }
        try {
            const item = option.item;
            console.log('选择的媒体项:', item);
            // 根据类型决定导航目标
            if (item.Type === 'Series') {
                // 如果是剧集系列，获取第一季第一集
                setLoading(true);
                const apiClient = getApiClient();
                // 获取该系列的所有季
                const seasonsResponse = await apiClient.get(`/Shows/${item.Id}/Seasons`, {
                    params: {
                        userId,
                        Fields: 'ItemCounts',
                        SortBy: 'SortName',
                        SortOrder: 'Ascending'
                    }
                });
                if (seasonsResponse.data && seasonsResponse.data.Items && seasonsResponse.data.Items.length > 0) {
                    const seasons = seasonsResponse.data.Items
                        .filter((season) => season.Type === 'Season')
                        .sort((a, b) => (a.IndexNumber || 0) - (b.IndexNumber || 0));
                    if (seasons.length === 0) {
                        message.warning('此剧集没有可播放的季');
                        setLoading(false);
                        return;
                    }
                    const firstSeason = seasons[0];
                    // 获取第一季的所有剧集
                    const episodesResponse = await apiClient.get(`/Users/${userId}/Items`, {
                        params: {
                            ParentId: firstSeason.Id,
                            Fields: 'Overview',
                            IncludeItemTypes: 'Episode',
                            Recursive: true,
                            SortBy: 'SortName',
                            SortOrder: 'Ascending'
                        }
                    });
                    if (episodesResponse.data && episodesResponse.data.Items && episodesResponse.data.Items.length > 0) {
                        const episodes = episodesResponse.data.Items
                            .filter((episode) => episode.Type === 'Episode')
                            .sort((a, b) => (a.IndexNumber || 0) - (b.IndexNumber || 0));
                        if (episodes.length > 0) {
                            navigate(`/player/${episodes[0].Id}`);
                            setLoading(false);
                        }
                        else {
                            message.warning('未找到可播放的剧集');
                            setLoading(false);
                        }
                    }
                    else {
                        message.warning('未找到可播放的剧集');
                        setLoading(false);
                    }
                }
                else {
                    message.warning('未找到任何季');
                    setLoading(false);
                }
            }
            else {
                // 如果是电影或单集，直接播放
                navigate(`/player/${id}`);
            }
        }
        catch (error) {
            console.error('处理媒体项失败:', error);
            message.error('处理失败，请重试');
        }
        finally {
            setValue('');
            setOptions([]);
        }
    };
    return (_jsx("div", { className: "search-container", children: _jsx(AutoComplete, { value: value, options: options, onSelect: handleSelect, onSearch: handleSearch, notFoundContent: loading ? _jsx(Spin, { size: "small" }) : value ? _jsx(Empty, { description: "\u672A\u627E\u5230\u76F8\u5173\u5185\u5BB9", image: Empty.PRESENTED_IMAGE_SIMPLE }) : null, className: "search-autocomplete", children: _jsx(Input, { placeholder: "\u641C\u7D22\u7535\u5F71\u3001\u5267\u96C6...", prefix: _jsx(SearchOutlined, {}), allowClear: true, className: "search-input" }) }) }));
};
export default SearchBar;
