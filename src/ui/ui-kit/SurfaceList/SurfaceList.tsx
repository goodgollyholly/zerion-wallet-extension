import React from 'react';
import cn from 'classnames';
import type { LinkProps } from 'react-router-dom';
import { Surface } from '../Surface/Surface';
import { UnstyledAnchor } from '../UnstyledAnchor';
import { UnstyledButton } from '../UnstyledButton';
import { UnstyledLink } from '../UnstyledLink';
import { VStack } from '../VStack';
import * as s from './styles.module.css';

export function ItemLink({
  to,
  onClick,
  children,
  style,
  className,
  decorationStyle,
  ...props
}: {
  to: LinkProps['to'];
  children: React.ReactNode;
  onClick?: React.AnchorHTMLAttributes<HTMLAnchorElement>['onClick'];
  className?: React.AnchorHTMLAttributes<HTMLAnchorElement>['className'];
  decorationStyle?: React.CSSProperties;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <UnstyledLink
      {...props}
      style={{ color: 'inherit', ...style }}
      to={to}
      onClick={onClick}
      className={cn(s.option, className)}
    >
      <div className={s.decoration} style={decorationStyle}>
        {children}
      </div>
    </UnstyledLink>
  );
}

export function ItemAnchor({
  href,
  target,
  onClick,
  children,
  style,
  decorationStyle,
  rel,
}: {
  href: string;
  target?: React.AnchorHTMLAttributes<HTMLAnchorElement>['target'];
  children: React.ReactNode;
  onClick?: React.AnchorHTMLAttributes<HTMLAnchorElement>['onClick'];
  style?: React.CSSProperties;
  decorationStyle?: React.CSSProperties;
  rel?: string;
}) {
  return (
    <UnstyledAnchor
      style={{ color: 'inherit', ...style }}
      href={href}
      target={target}
      onClick={onClick}
      className={s.option}
      rel={rel}
    >
      <div className={s.decoration} style={decorationStyle}>
        {children}
      </div>
    </UnstyledAnchor>
  );
}

export const ItemButton = React.forwardRef<
  HTMLButtonElement,
  {
    children: React.ReactNode;
    style?: React.CSSProperties;
    highlighted?: boolean;
    outlined?: boolean;
    decorationStyle?: React.CSSProperties;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(
  (
    {
      children,
      style,
      highlighted,
      outlined = false,
      decorationStyle,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <UnstyledButton
        style={{ color: 'inherit', ...style }}
        className={cn(
          className,
          s.option,
          highlighted ? s.highlighted : undefined
        )}
        ref={ref}
        {...props}
      >
        <div
          className={s.decoration}
          style={{
            border: outlined ? '1px solid var(--primary)' : undefined,
            paddingBlock: 7,
            ...decorationStyle,
          }}
        >
          {children}
        </div>
      </UnstyledButton>
    );
  }
);

export const ItemLabel = React.forwardRef<
  HTMLLabelElement,
  {
    children: React.ReactNode;
    style?: React.CSSProperties;
    highlighted?: boolean;
  } & React.LabelHTMLAttributes<HTMLLabelElement>
>(({ children, style, highlighted, ...props }, ref) => {
  return (
    <label
      style={{ color: 'inherit', ...style }}
      className={cn(s.option, highlighted ? s.highlighted : undefined)}
      ref={ref}
      {...props}
    >
      <div className={s.decoration}>{children}</div>
    </label>
  );
});

export interface Item {
  key: string | number;
  component: JSX.Element;
  to?: LinkProps['to'];
  href?: string;
  target?: React.AnchorHTMLAttributes<HTMLAnchorElement>['target'];
  rel?: React.AnchorHTMLAttributes<HTMLAnchorElement>['rel'];
  isInteractive?: boolean;
  onClick?: React.ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  buttonType?: 'button' | 'submit';
  disabled?: React.ButtonHTMLAttributes<HTMLButtonElement>['disabled'];
  style?: React.CSSProperties;
  separatorTop?: boolean;
  separatorLeadingInset?: number;
  pad?: boolean;
}

function isInteractive(item: Item): boolean {
  return item.isInteractive ?? Boolean(item.to || item.href || item.onClick);
}

export const SurfaceList = React.forwardRef(
  (
    {
      items,
      gap = 0,
      style,
      ...props
    }: {
      items: Item[];
      gap?: number;
      style?: React.CSSProperties;
    } & React.HTMLAttributes<HTMLDivElement>,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const emptyItemPaddingBlock = 8;
    const firstItemIsInteractive = items.length && isInteractive(items[0]);
    const lastItemIsInteractive =
      items.length && isInteractive(items[items.length - 1]);
    return (
      <Surface
        ref={ref}
        className={s.root}
        style={{
          paddingBlockStart: firstItemIsInteractive ? 6 : 0,
          paddingBlockEnd: lastItemIsInteractive ? 6 : 0,
          ...style,
        }}
        {...props}
      >
        <VStack gap={gap} style={{ height: style?.height }}>
          {items.map((item, index) => {
            const {
              style,
              separatorTop = false,
              separatorLeadingInset = 0,
              pad = true,
            } = item;
            const isInteractiveItem = isInteractive(item);
            const component = item.to ? (
              <ItemLink
                to={item.to}
                onClick={
                  item.onClick as React.AnchorHTMLAttributes<HTMLAnchorElement>['onClick']
                }
              >
                {item.component}
              </ItemLink>
            ) : item.href ? (
              <ItemAnchor
                href={item.href}
                target={item.target}
                onClick={
                  item.onClick as React.AnchorHTMLAttributes<HTMLAnchorElement>['onClick']
                }
              >
                {item.component}
              </ItemAnchor>
            ) : item.onClick ? (
              <ItemButton
                disabled={item.disabled}
                onClick={item.onClick}
                type={item.buttonType}
              >
                {item.component}
              </ItemButton>
            ) : pad === false ? (
              item.component
            ) : (
              <div style={{ paddingBlock: emptyItemPaddingBlock }}>
                {item.component}
              </div>
            );
            if (item.key == null) {
              throw new Error('No key');
            }
            // const nextItemHasNoSeparator =
            //   index === items.length - 1 ||
            //   items[index + 1].separatorTop !== true;
            // const noSeparator = !separatorTop && nextItemHasNoSeparator;
            return (
              <div
                key={item.key}
                // not sure if this looks good yet. Seems too thick
                // className={noSeparator ? s.noSeparator : undefined}
                style={{
                  padding: isInteractiveItem ? undefined : '0 16px',
                  ...style,
                }}
              >
                {index > 0 && separatorTop ? (
                  <div
                    style={{
                      height: 1,
                      marginLeft:
                        (isInteractiveItem ? 16 : 0) + separatorLeadingInset,
                      marginRight: isInteractiveItem ? 16 : 0,
                      marginBottom: 4,
                      marginTop: 4,
                      backgroundColor: 'var(--neutral-300)',
                    }}
                  />
                ) : null}
                {component}
              </div>
            );
          })}
        </VStack>
      </Surface>
    );
  }
);
