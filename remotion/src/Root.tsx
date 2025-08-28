import { Composition } from 'remotion';
import { SceneChatDemo } from './comps/SceneChatDemo';
import { SceneCTA } from './comps/SceneCTA';
import { SceneEmail } from './comps/SceneEmail';
import SceneIntroOlympus from './comps/SceneIntroOlympus';
import { ScenePlan } from './comps/ScenePlan';
import { SceneResults } from './comps/SceneResults';

export const RemotionRoot: React.FC = () => {
  const durationInFrames = 60 * 30
  return (
    <>
      <Composition
        id="hermes-launch"
        component={() => (
          <>
            <SceneIntroOlympus from={0} duration={90} src={require('../assets/gods_intro.mp4')} />
            <SceneChatDemo from={90} duration={180} />
            <ScenePlan from={270} duration={180} />
            <SceneResults from={450} duration={180} />
            <SceneEmail from={630} duration={120} />
            <SceneCTA from={750} duration={90} />
          </>
        )}
        width={1920}
        height={1080}
        durationInFrames={durationInFrames}
        fps={30}
        defaultProps={{}}
      />
    </>
  );
};

export default RemotionRoot;

