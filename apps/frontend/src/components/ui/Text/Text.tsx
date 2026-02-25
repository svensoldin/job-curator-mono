import clsx from 'clsx';

interface TextProps extends React.HtmlHTMLAttributes<HTMLParagraphElement> {}

const Text = ({ children, className }: TextProps) => (
  <p className={clsx('text-gray-400', className)}>{children}</p>
);

export default Text;
