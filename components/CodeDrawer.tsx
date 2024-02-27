import React, { ReactNode } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
type Props = {
  code?: ReactNode;
};

const CodeDrawer = ({ code }: Props) => {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="p-5 rounded-lg h-full flex flex-col">
      <div className="flex gap-3 items-center">
        <Button onClick={() => setOpen(!open)} size="icon" variant="ghost">
          <div className={`${open ? 'rotate-180' : ''} transition-all`}>
            <ChevronLeft />
          </div>
        </Button>
        <h3 className="text-lg text-slate-500">Code</h3>
      </div>
      {!!code && (
        <motion.div
          animate={{
            width: open ? 'auto' : 0,
            opacity: open ? 1 : 0,
          }}
          className="flex-1 overflow-auto relative"
        >
          <div className="max-w-[500px]">{code}</div>
        </motion.div>
      )}
    </div>
  );
};

export default CodeDrawer;
