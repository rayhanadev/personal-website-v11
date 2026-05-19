import { Anchor } from "./Anchor";
import { Blockquote } from "./Blockquote";
import { Div } from "./Div";
import { Emphasis } from "./Emphasis";
import { Figure } from "./Figure";
import { H1 } from "./H1";
import { H2 } from "./H2";
import { H3 } from "./H3";
import { H4 } from "./H4";
import { H5 } from "./H5";
import { H6 } from "./H6";
import { HorizontalRule } from "./HorizontalRule";
import { InlineCode } from "./InlineCode";
import { ListItem } from "./ListItem";
import { MdxImage } from "./MdxImage";
import { OrderedList } from "./OrderedList";
import { Paragraph } from "./Paragraph";
import { Pre } from "./Pre";
import { Strong } from "./Strong";
import { Table } from "./Table";
import { TableBody } from "./TableBody";
import { TableCell } from "./TableCell";
import { TableHead } from "./TableHead";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { UnorderedList } from "./UnorderedList";

export const mdxComponents = {
  a: Anchor,
  blockquote: Blockquote,
  code: InlineCode,
  div: Div,
  em: Emphasis,
  Figure,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  hr: HorizontalRule,
  img: MdxImage,
  li: ListItem,
  ol: OrderedList,
  p: Paragraph,
  pre: Pre,
  strong: Strong,
  table: Table,
  tbody: TableBody,
  td: TableCell,
  th: TableHeader,
  thead: TableHead,
  tr: TableRow,
  ul: UnorderedList,
};
