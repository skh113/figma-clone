import {
  useBroadcastEvent,
  useEventListener,
  useMyPresence,
  useOthers
} from '@/liveblocks.config';
import { CursorMode, CursorState, Reaction, ReactionEvent } from '@/types/type';
import React, { useCallback, useEffect, useState } from 'react';
import CursorChat from './cursor/CursorChat';
import LiveCursors from './cursor/LiveCursors';
import ReactionSelector from '@/components/reaction/ReactionButton';
import FlyingReaction from '@/components/reaction/FlyingReaction';
import useInterval from '@/hooks/useInterval';

const Live = () => {
  const others = useOthers();
  const [{ cursor }, updateMyPresence] = useMyPresence() as any;
  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.Hidden
  });
  const [reaction, setReaction] = useState<Reaction[]>([]);

  const broadcast = useBroadcastEvent();

  useInterval(() => {
    if (
      cursorState.mode === CursorMode.Reaction &&
      cursorState.isPressed &&
      cursor
    ) {
      setReaction((reactions) =>
        reactions.concat([
          {
            point: { x: cursor.x, y: cursor.y },
            value: cursorState.reaction,
            timestamp: Date.now()
          }
        ])
      );

      broadcast({
        x: cursor.x,
        y: cursor.y,
        value: cursorState.reaction
      });
    }
  }, 100);

  useEventListener((eventData) => {
    const event = eventData.event as ReactionEvent;

    setReaction((reactions) =>
      reactions.concat([
        {
          point: { x: event.x, y: event.y },
          value: event.value,
          timestamp: Date.now()
        }
      ])
    );
  });

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    event.preventDefault();

    if (cursor === null || cursorState.mode !== CursorMode.ReactionSelector) {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      updateMyPresence({ cursor: { x, y } });
    }
  }, []);

  const handlePointerLeave = useCallback((event: React.PointerEvent) => {
    setCursorState({ mode: CursorMode.Hidden });

    updateMyPresence({ cursor: null, message: null });
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      updateMyPresence({ cursor: { x, y } });

      setCursorState((state: CursorState) =>
        cursorState.mode === CursorMode.Reaction
          ? { ...state, isPressed: true }
          : state
      );
    },
    [cursorState.mode, setCursorState]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      setCursorState((state: CursorState) =>
        cursorState.mode === CursorMode.Reaction
          ? { ...state, isPressed: true }
          : state
      );
    },
    [cursorState.mode, setCursorState]
  );

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case '/':
          setCursorState({
            mode: CursorMode.Chat,
            previosMessage: null,
            message: ''
          });
          break;
        case 'Escape':
          updateMyPresence({ message: '' });
          setCursorState({ mode: CursorMode.Hidden });
          break;
        case 'e':
          cursorState.mode !== CursorMode.Chat &&
            setCursorState({
              mode: CursorMode.ReactionSelector
            });
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') e.preventDefault();
    };

    return () => {
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('keydown', onKeyDown);
    };
  }, [updateMyPresence]);

  const setReactions = useCallback((reaction: string) => {
    setCursorState({
      mode: CursorMode.Reaction,
      reaction,
      isPressed: false
    });
  }, []);

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="h-[100svh] w-full flex justify-center items-center text-center"
    >
      <h1 className="text-2xl text-white">Figma Clone</h1>

      {reaction.map((item, index) => (
        <FlyingReaction
          key={item.timestamp.toString()}
          x={item.point.x}
          y={item.point.y}
          timestamp={item.timestamp}
          value={item.value}
        />
      ))}

      {cursor && (
        <CursorChat
          cursor={cursor}
          cursorState={cursorState}
          setCursorState={setCursorState}
          updateMyPresence={updateMyPresence}
        />
      )}

      {cursorState.mode === CursorMode.ReactionSelector && (
        <ReactionSelector setReaction={setReactions} />
      )}

      <LiveCursors others={others} />
    </div>
  );
};

export default Live;
