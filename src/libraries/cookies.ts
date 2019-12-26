import { IncomingMessage, ServerResponse } from "http"
import cookieparser, { CookieSerializeOptions } from "cookie"

export type CookieData = { [key: string]: string }

export type SetCookieFn = (
  name: string,
  value: string,
  options?: cookieparser.CookieSerializeOptions
) => void

export type GetCookieFn = (name: string) => CookieData

export const getCookie = (req: IncomingMessage): GetCookieFn => {
  const headers: any = req.headers || {}

  const cookies = new Map(
    Object.entries(cookieparser.parse(req.headers.cookie || "") || {})
  )

  return (name: string): CookieData => cookies.get(name) as any
}

export const setCookie = (res: ServerResponse): SetCookieFn => {
  const headers: any = res.getHeaders() || {}

  const cookies = new Map(
    Object.entries(cookieparser.parse(headers["set-cookie"] || ""))
  )

  return (
    name: string,
    value: string,
    options: CookieSerializeOptions = {}
  ): void => {
    cookies.set(name, cookieparser.serialize(name, value, options))
    res.setHeader("set-cookie", Array.from(cookies.values()))
  }
}
