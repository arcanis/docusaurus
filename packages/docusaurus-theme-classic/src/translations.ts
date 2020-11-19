/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TranslationFile, TranslationFileContent} from '@docusaurus/types';
import {
  ThemeConfig,
  Navbar,
  NavbarItem,
  Footer,
} from '@docusaurus/theme-common';

// TODO imports due to transpiling with target esnext...
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {keyBy, chain, flatten} = require('lodash');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {mergeTranslations} = require('@docusaurus/utils');

function getNavbarTranslationFile(navbar: Navbar): TranslationFileContent {
  //  TODO handle properly all the navbar item types here!
  function flattenNavbarItems(items: NavbarItem[]): NavbarItem[] {
    const subItems = flatten(
      items.map((item) => {
        const allSubItems = flatten([item.items ?? []]);
        return flattenNavbarItems(allSubItems);
      }),
    );
    return [...items, ...subItems];
  }

  const allNavbarItems = flattenNavbarItems(navbar.items);

  const navbarItemsTranslations = chain(
    allNavbarItems.filter((navbarItem) => !!navbarItem.label),
  )
    .keyBy((navbarItem) => `item.label.${navbarItem.label}`)
    .mapValues((navbarItem) => ({
      message: navbarItem.label,
      description: `Navbar item with label ${navbarItem.label}`,
    }))
    .value();

  const titleTranslations = navbar.title
    ? {title: {message: navbar.title, description: 'The title in the navbar'}}
    : {};

  return mergeTranslations([titleTranslations, navbarItemsTranslations]);
}
function translateNavbar(
  navbar: Navbar,
  navbarTranslations: TranslationFileContent,
): Navbar {
  return {
    ...navbar,
    title: navbarTranslations.title?.message ?? navbar.title,
    //  TODO handle properly all the navbar item types here!
    items: navbar.items.map((item) => ({
      ...item,
      label:
        navbarTranslations[`item.label.${item.label}`]?.message ?? item.label,
    })),
  };
}

function getFooterTranslationFile(footer: Footer): TranslationFileContent {
  // TODO POC code
  const footerLinkTitles: TranslationFileContent = chain(
    footer.links.filter((link) => !!link.title),
  )
    .keyBy((link) => `link.title.${link.title}`)
    .mapValues((link) => ({
      message: link.title,
      description: `The title of the footer links column with title=${link.title} in the footer`,
    }))
    .value();

  const footerLinkLabels: TranslationFileContent = chain(
    flatten(footer.links.map((link) => link.items)).filter(
      (link) => !!link.label,
    ),
  )
    .keyBy((linkItem) => `link.item.label.${linkItem.label}`)
    .mapValues((linkItem) => ({
      message: linkItem.label,
      description: `The label of footer link with label=${
        linkItem.label
      } linking to ${linkItem.to ?? linkItem.href}`,
    }))
    .value();

  const copyright = footer.copyright
    ? {
        copyright: {
          message: footer.copyright,
          description: 'The footer copyright',
        },
      }
    : {};

  return mergeTranslations([footerLinkTitles, footerLinkLabels, copyright]);
}
function translateFooter(
  footer: Footer,
  footerTranslations: TranslationFileContent,
): Footer {
  const links = footer.links.map((link) => ({
    ...link,
    title:
      footerTranslations[`link.title.${link.title}`]?.message ?? link.title,
    items: link.items.map((linkItem) => ({
      ...linkItem,
      label:
        footerTranslations[`link.item.label.${linkItem.label}`]?.message ??
        linkItem.label,
    })),
  }));

  const copyright = footerTranslations.copyright?.message ?? footer.copyright;

  return {
    ...footer,
    links,
    copyright,
  };
}

exports.getTranslationFiles = async function getTranslationFiles({
  themeConfig,
}: {
  themeConfig: ThemeConfig;
}): Promise<TranslationFile[]> {
  return [
    {path: 'navbar', content: getNavbarTranslationFile(themeConfig.navbar)},
    {path: 'footer', content: getFooterTranslationFile(themeConfig.footer)},
  ];
};

// TODO create  a package like @docusaurus/theme-common-node ?
exports.translateThemeConfig = function translateThemeConfig({
  themeConfig,
  translationFiles,
}: {
  themeConfig: ThemeConfig;
  translationFiles: TranslationFile[];
}): ThemeConfig {
  const translationFilesMap: Record<string, TranslationFile> = keyBy(
    translationFiles,
    (f) => f.path,
  );

  return {
    ...themeConfig,
    navbar: translateNavbar(
      themeConfig.navbar,
      translationFilesMap.navbar.content,
    ),
    footer: translateFooter(
      themeConfig.footer,
      translationFilesMap.footer.content,
    ),
  };
};
