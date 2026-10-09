jest.mock('next/headers',()=>({headers:jest.fn(),cookies:jest.fn()}));
import {headers,cookies} from 'next/headers';
import {registrationAcquisition} from '@/lib/acquisition-server';
import {ACQUISITION_COOKIE,DISCOVERY_COOKIE,normalizeAcquisition,signAcquisition} from '@/lib/acquisition';
beforeEach(()=>{process.env.AUTH_SECRET='acquisition-test';(headers as jest.Mock).mockResolvedValue(new Headers());const token=signAcquisition(normalizeAcquisition({source:'instagram',campaign:'launch'},'https://cinelists.com')!);(cookies as jest.Mock).mockResolvedValue({get:(name:string)=>({value:name===ACQUISITION_COOKIE?token:name===DISCOVERY_COOKIE?'friend':''})});});
test('new registration reads source and OAuth survey separately',async()=>{expect(await registrationAcquisition()).toMatchObject({acquisitionSource:'instagram',acquisitionCampaign:'launch',discoveryAnswer:'friend'});});
test.each(['dnt','sec-gpc'])('privacy preference %s skips automatic source but preserves voluntary answer',async flag=>{(headers as jest.Mock).mockResolvedValue(new Headers({[flag]:'1'}));expect(await registrationAcquisition()).toEqual({discoveryAnswer:'friend'});});
test('missing first-touch and survey cookies leave historical metadata unknown',async()=>{(cookies as jest.Mock).mockResolvedValue({get:()=>undefined});expect(await registrationAcquisition()).toEqual({});});
