import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8080/api/v1';

async function handler(req: NextRequest) {
    const { pathname, search } = req.nextUrl;
    const path = pathname.replace('/api/proxy', '');
    const url = `${API_BASE_URL}${path}${search}`;

    const headers: Record<string, string> = {};
    const authorization = req.headers.get('Authorization');
    if (authorization) {
        headers['Authorization'] = authorization;
    }

    try {
        const response = await axios({
            method: req.method,
            url: url,
            data: req.method !== 'GET' ? await req.json() : undefined,
            headers: headers,
            responseType: 'json',
        });

        return NextResponse.json(response.data, { status: response.status });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            return NextResponse.json(axiosError.response?.data, {
                status: axiosError.response?.status || 500,
            });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };