import React, { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { useHistory, Switch, useParams, useLocation, matchPath } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { useRedux } from '@/hooks/useRedux';
import PageLoading from '@/components/PageLoading';
import RouteWithSubRoutes from '@/components/RouteWithSubRoutes';
import { thyCookie } from '@thyiad/util';
import { getMatchRoute, canUseWindow } from '@/utils/index';
import { LOGIN_COOKIE_KEY, LOGIN_PATHNAME } from '@client/constants/index';
import systemInfo from '@client/constants/systemInfo';
import { fetchCurrentUserinfo } from '@/models/User';
import AvatarDropdown from './AvatarDropdown';
import CommonFooter from './CommonFooter';
import { useRole } from '@/hooks/useRole';

const { Header, Content } = Layout;

import './TopMenuLayout.scss';
import logo from '@/assets/img/logo.png';

const TopMenuLayout: FC<RoutePageProps> = (props) => {
    const history = useHistory();
    const { routes } = props;
    const { state, actions } = useRedux();
    const { isFirstRender, checkRole } = useRole(history, state.currentUserinfo?.role);

    useEffect(() => {
        const accessKey = thyCookie.get(LOGIN_COOKIE_KEY);
        if (!accessKey) {
            window.location.href = `${LOGIN_PATHNAME}?target=${encodeURIComponent(window.location.href)}`;
            return;
        }
        fetchCurrentUserinfo().then((res) => {
            actions.user.setCurrentUserinfo(res);
        });
    }, [actions.user]);

    const initActiveMenu: string = useMemo(() => {
        if (!canUseWindow()) {
            return '';
        }
        const findedRoute = getMatchRoute(window.location.pathname);
        if (findedRoute) {
            return findedRoute.redirect || findedRoute.path;
        }
        return '';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onMenuClick = useCallback(
        (event: any) => {
            const { key } = event;

            history.push(key);
        },
        [history],
    );

    const renderMenu = useCallback(
        (item: RouteProps) => {
            if (item.hideInMenu || (item.roles && item.roles.includes(state.currentUserinfo?.role))) {
                return null;
            }
            return Array.isArray(item.routes) && item.routes.length > 0 ? (
                <Menu.SubMenu key={item.path} icon={item.icon} title={item.title}>
                    {item.routes.map((child) => {
                        return renderMenu(child);
                    })}
                </Menu.SubMenu>
            ) : (
                <Menu.Item key={item.path} icon={item.icon}>
                    {item.title}
                </Menu.Item>
            );
        },
        [state.currentUserinfo],
    );

    return useMemo(() => {
        // 如果用户信息为空，显示loading
        if (!state.currentUserinfo) {
            return <PageLoading />;
        }

        if (isFirstRender.current) {
            checkRole(history, window.location.pathname, state.currentUserinfo.role);
            isFirstRender.current = false;
        }

        return (
            <Layout className="top-menu-layout">
                <Header className="top-menu-layout-header">
                    <div className="sider-logo">
                        <a href="/">
                            <img src={logo} alt="" />
                            <span>{systemInfo.title}</span>
                        </a>
                    </div>
                    <Menu
                        onClick={onMenuClick}
                        theme="dark"
                        mode="horizontal"
                        defaultSelectedKeys={[initActiveMenu]}
                        style={{ lineHeight: '64px', flex: 1, overflow: 'hidden' }}
                    >
                        {routes?.map((item) => {
                            return renderMenu(item);
                        })}
                    </Menu>
                    <AvatarDropdown nameColor="#fff" />
                </Header>
                <Content className="top-menu-layout-content">
                    <div className="site-layout-content-wrapper">
                        <Switch>
                            {routes?.map((route) => (
                                <RouteWithSubRoutes key={route.name} {...route} />
                            ))}
                        </Switch>
                        <CommonFooter />
                    </div>
                </Content>
            </Layout>
        );
    }, [state.currentUserinfo, isFirstRender, onMenuClick, initActiveMenu, routes, checkRole, history, renderMenu]);
};

export default TopMenuLayout;
