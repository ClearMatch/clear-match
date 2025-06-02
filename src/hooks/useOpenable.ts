import { useCallback, useState } from 'react';

function useOpenable() {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);

  const onOpenChange = () => {
    setIsOpen((prev) => !prev);
  };

  return {
    isOpen,
    onOpen,
    onClose,
    onOpenChange,
  };
}

export default useOpenable;
