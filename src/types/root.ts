import { ComponentClass, FunctionComponent } from 'react';

// third-party
import { Icon } from 'iconsax-react';

// ==============================|| TYPES - ROOT  ||============================== //

export type KeyedObject = {
  [key: string]: string | number | KeyedObject | any;
};

