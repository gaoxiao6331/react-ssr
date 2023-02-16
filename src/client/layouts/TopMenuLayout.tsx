import React, { FC, useEffect, useMemo, useCallback } from 'react';
import { Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { useRedux } from '@/hooks/useRedux';
import PageLoading from '@/components/PageLoading';
import { thyCookie, thyEnv } from '@thyiad/util';
import { getMatchRoute } from '@/utils/index';
import { LOGIN_COOKIE_KEY } from '@client/constants/index';
import { LOGIN_PATHNAME } from '@client/constants/url';
import systemInfo from '@client/constants/systemInfo';
import { fetchCurrentUser } from '@/models/User';
import AvatarDropdown from './AvatarDropdown';
import CommonFooter from './CommonFooter';
import { useRole } from '@/hooks/useRole';

const { Header, Content } = Layout;

import './TopMenuLayout.scss';
import logo from '@/assets/img/logo.png';
import { renderRoute } from '@client/utils/ui';

const TopMenuLayout: FC<RoutePageProps> = (props) => {
    const { routes } = props;
    const { state, actions } = useRedux();

    const navigate = useNavigate();
    const location = useLocation();
    const { isFirstRender, checkRole } = useRole(navigate, location, state.currentUser?.role);

    useEffect(() => {
        const accessKey = thyCookie.get(LOGIN_COOKIE_KEY);
        if (!accessKey) {
            window.location.href = `${LOGIN_PATHNAME}?target=${encodeURIComponent(window.location.href)}`;
            return;
        }
        fetchCurrentUser().then((res) => {
            actions.user.setcurrentUser(res);
        });
    }, [actions.user]);

    const initActiveMenu: string = useMemo(() => {
        if (!thyEnv.canUseWindow()) {
            return '';
        }
        const findedRoute = getMatchRoute();
        if (findedRoute) {
            return findedRoute.redirect || findedRoute.path;
        }
        return '';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onMenuClick = useCallback(
        (event: any) => {
            const { key } = event;

            navigate(key);
        },
        [navigate],
    );

    const renderMenu = useCallback(
        (item: RouteProps) => {
            if (item.hideInMenu || (item.roles && !item.roles.includes(state.currentUser?.role))) {
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
        [state.currentUser],
    );

    return useMemo(() => {
        // 如果用户信息为空，显示loading
        if (!state.currentUser) {
            return <PageLoading />;
        }

        if (isFirstRender.current) {
            checkRole(navigate, window.location.pathname, state.currentUser?.role);
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
                        <Outlet />
                    </div>
                    <CommonFooter />
                </Content>
            </Layout>
        );
    }, [state.currentUser, isFirstRender, onMenuClick, initActiveMenu, routes, checkRole, renderMenu, navigate]);
};

export default TopMenuLayout;
