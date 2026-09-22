import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | Raj Griha` : 'Raj Griha — Hotel in Uttarkashi';
  }, [title]);
};

export default usePageTitle;