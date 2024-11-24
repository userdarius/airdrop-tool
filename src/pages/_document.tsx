/* eslint-disable react/react-in-jsx-scope */
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <meta
        name="description"
        content="The Rootlets are friendly creatures that have descended to colonize Earth with their cuteness! Think steampunk space-pigs taking over the Suiverse."
      />
      <meta property="og:title" content="ROOTLETS 🐽" />
      <meta
        property="og:description"
        content="The Rootlets are friendly creatures that have descended to colonize Earth with their cuteness! Think steampunk space-pigs taking over the Suiverse."
      />
      <meta
        property="og:image"
        content={`${process.env.NEXT_PUBLIC_DOMAIN}/og-image.jpg`}
      />
      <meta property="og:type" content="website" />
      <link rel="icon" href={`${process.env.NEXT_PUBLIC_DOMAIN}/icon.ico`} sizes="any" />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
