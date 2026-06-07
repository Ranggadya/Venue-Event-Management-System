import type { NextFunction, Request, RequestHandler, Response } from 'express';

type LayoutRenderOptions = Record<string, unknown> & {
  layout?: string | false;
  body?: string;
};

type RenderCallback = (err: Error, html: string) => void;

type RenderOptionsOrCallback = LayoutRenderOptions | RenderCallback;

function isRenderCallback(value: unknown): value is RenderCallback {
  return typeof value === 'function';
}

function getLayoutName(
  res: Response,
  options: LayoutRenderOptions,
): string | false | undefined {
  if (options.layout === false) {
    return false;
  }

  if (typeof options.layout === 'string') {
    return options.layout;
  }

  const configuredLayout: unknown = res.app.get('layout');
  return typeof configuredLayout === 'string' ? configuredLayout : undefined;
}

export function ejsLayoutMiddleware(): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction) => {
    const originalRender = res.render.bind(res) as Response['render'];
    const render = (
      view: string,
      options?: object,
      callback?: RenderCallback,
    ): void => {
      if (callback) {
        originalRender(view, options, callback);
        return;
      }

      originalRender(view, options);
    };

    res.render = function renderWithLayout(
      view: string,
      optionsOrCallback?: RenderOptionsOrCallback,
      callback?: RenderCallback,
    ): void {
      const options = isRenderCallback(optionsOrCallback)
        ? {}
        : (optionsOrCallback ?? {});
      const renderCallback = isRenderCallback(optionsOrCallback)
        ? optionsOrCallback
        : callback;
      const layout = getLayoutName(res, options);

      if (!layout) {
        render(view, options, renderCallback);
        return;
      }

      render(view, options, (viewError: Error, html: string) => {
        if (viewError) {
          if (renderCallback) {
            renderCallback(viewError, '');
            return;
          }

          next(viewError);
          return;
        }

        const layoutOptions: LayoutRenderOptions = {
          ...options,
          body: html,
        };

        render(
          layout,
          layoutOptions,
          (layoutError: Error, layoutHtml: string) => {
            if (renderCallback) {
              renderCallback(layoutError, layoutHtml);
              return;
            }

            if (layoutError) {
              next(layoutError);
              return;
            }

            res.send(layoutHtml);
          },
        );
      });
    } as Response['render'];

    next();
  };
}
