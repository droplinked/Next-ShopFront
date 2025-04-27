import React from 'react';
import { IAppShow } from './interface';

const AppShow = ({ show }: IAppShow) => {
  const must_show_array = Array.isArray(show) ? show : [show];
  const combined_shows = must_show_array.reduce<React.ReactNode[]>((acc, must_show) => {
    if (Boolean(must_show.when)) {
      acc.push(must_show.then);
    } else if ('else' in must_show) {
      acc.push(must_show.else);
    }
    return acc;
  }, []);
  return (
    <>
      {combined_shows.map((show, index) => (
        <React.Fragment key={index}>{show}</React.Fragment>
      ))}
    </>
  );
};

export default AppShow;
