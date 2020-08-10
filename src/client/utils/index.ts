import { initImplements, thyCookie } from '@thyiad/util';
import { msgLoading, toast, alert, confirm } from './ui';
import { LOGIN_COOKIE_KEY, LOGIN_PATHNAME, TOKEN_HEADER_NAME } from '@/constant/index';
import rootRoutes from '../route.tsx';
import { matchPath } from 'react-router-dom';

export const initThyiadUtil = () => {
    initImplements({
        ui: {
            msgLoading,
            toast,
            alert,
            confirm,
        },
        req: {
            loginCookeyKey: LOGIN_COOKIE_KEY,
            tokenHeaderName: TOKEN_HEADER_NAME,
            logout: logout,
        },
    });
};

export const canUseWindow = () => {
    return typeof window !== 'undefined';
};

/**
 * 通过pathname检索对应路由
 * @param pathname
 */
export const getMatchRoute = (pathname: string, routes?: RouteProps[]) => {
    routes = routes || rootRoutes;
    const findedRoute = routes?.find((route) => matchPath(pathname, route));
    if (findedRoute) {
        if (findedRoute.routes) {
            const nextFindedRoute = getMatchRoute(pathname, findedRoute.routes);
            if (nextFindedRoute) {
                return nextFindedRoute;
            }
        }
        return findedRoute;
    }
    return null;
};

/**
 * 退出登录
 */
export const logout = (): void => {
    thyCookie.remove(LOGIN_COOKIE_KEY);
    window.location.href = `${LOGIN_PATHNAME}?target=${encodeURIComponent(window.location.href)}`;
};
