import Image from "next/image";
import type { Metadata } from 'next'
import { getFrameMetadata } from '@coinbase/onchainkit';

export const dynamic = 'force-dynamic';

const initialId = 0;

const frameMetadata = getFrameMetadata({
    image: "rico.png",
    post_url: `https://onframe-cats.vercel.app/api/${initialId}`,
    buttons: ['️️⬅️', '️➡️', 'Random']
});

export const metadata: Metadata = {
    title: "Cats of Farcaster",
    description: "View and share the Cats of Farcaster",
    other: {
        ...frameMetadata
    }
}


export default function Home() {
  return (
      <html>
          <body>
            <Image src="rico.png" alt={"Grumpy Cat"} width="600" height="600"/>
          </body>
      </html>
  );
}
