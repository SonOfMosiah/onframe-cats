// Steps 1. import getFrameAccountAddress from @coinbase/onchainkit
import { getFrameMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import api from 'api';

export const dynamic = 'force-dynamic';

type Params = {
    params: {
        id: number
    }
}
export async function POST(req: NextRequest, { params}: Params): Promise<Response> {
    const { id } = params;
    return getResponse(req, Number(id));
}

async function getResponse(req: NextRequest, id: number): Promise<NextResponse> {

    const body = await req.json();

    const {isValid, message} = await getFrameMessage(body)

    if (!isValid) {
        return new NextResponse(JSON.stringify({message: 'invalid message'}), {
            status: 400,
            headers: {
                'content-type': 'application/json',
            },
        });
    }

    const {fid, buttonIndex, castId} = message

    const sdk = api('@neynar/v2.0#66h3glq5brsni');

    const allCastsResult = await sdk.allCastsInThread({
        threadHash: typeof castId.hash === 'string' && castId.hash.startsWith('0x') ? castId.hash : (castId.hash as unknown as Buffer).toString('hex'),
        viewerFid: fid,
        api_key: process.env.NEYNAR_API_KEY,
    })
        .then(({data}: { data: any }) => {
            console.log(data)
            return data.result
        })
        .catch((err: any) => {
            console.error(err)
            return generateMetadata({id})
        });

    const {casts: allCasts} = allCastsResult

    if (!allCasts || allCasts.length === 0) {
        return generateMetadata({id})
    }

    const imagesSet: Set<string> = new Set(['https://onframe-cats.vercel.app/rico.png']);

    for (const cast of allCasts) {
        if (cast.embeds.length > 0) {
            for (const embed of cast.embeds) {
                if (embed.url && embed.url !== 'https://onframe-cats.vercel.app') {
                    imagesSet.add(embed.url);
                }
            }
        }
    }

    // Converting Set to Array for index-based access
    const images: string[] = Array.from(imagesSet);

    let nextId: number;
    if (Number(buttonIndex) === 1) {
        // previous
        if (id === 0) {
            nextId = images.length - 1;
        } else {
            nextId = Number(id) - 1;
        }
    } else if (Number(buttonIndex) === 2) {
        // next
        nextId = Number(id) + 1;

        if (nextId >= images.length) {
            nextId = 0;
        }
    } else {
        // random
        const max = images.length - 1;
        nextId = Math.floor(Math.random() * max);

        // check if the random id is the same as the current id
        if (nextId === id) {
            nextId = id + 1;
        }
    }

    const nextImage = images[Number(nextId ?? 0)];

    return generateMetadata({id: nextId, image: nextImage})
}

const generateMetadata = ({id, image = 'https://onframe-cats.vercel.app/rico.png'}: {id: number, image?: string}) => {
    return new NextResponse(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Farcaster Cat</title>
                <meta name="fc:frame" content="vNext">
                <meta name="fc:frame:image" content="${image}">
                <meta name="fc:frame:post_url" content="https://onframe-cats.vercel.app/api/${id}">
                <meta property="fc:frame:button:1" content="⬅️"/>
                <meta property="fc:frame:button:2" content="➡️"/>
                <meta property="fc:frame:button:3" content="Random"/>
              </head>
              <body>
                <p>Cat of Farcaster</p>
              </body>
            </html>
          `);
}
