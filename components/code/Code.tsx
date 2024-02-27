import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Code = ({ code, lang }: { code: string; lang: string }) => {
  return (
    <SyntaxHighlighter
      language={lang}
      style={oneDark}
      wrapLines={true}
      lineProps={{ style: { wordBreak: 'break-word', whiteSpace: 'pre-wrap' } }}
    >
      {code}
    </SyntaxHighlighter>
  );
};

export default Code;
