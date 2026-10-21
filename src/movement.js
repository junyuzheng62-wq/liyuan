// One input path for real-time updates and deterministic browser regressions.
export function movementVelocity(input){
  let x=input.x+(input.keys.KeyD||input.keys.ArrowRight?1:0)-(input.keys.KeyA||input.keys.ArrowLeft?1:0);
  let y=input.y+(input.keys.KeyW||input.keys.ArrowUp?1:0)-(input.keys.KeyS||input.keys.ArrowDown?1:0);
  if(input.locked)x=y=0;
  const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
  return {x:(Math.cos(input.yaw)*x-Math.sin(input.yaw)*y)*3.2,z:(-Math.sin(input.yaw)*x-Math.cos(input.yaw)*y)*3.2,length};
}
