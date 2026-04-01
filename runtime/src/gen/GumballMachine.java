public class GumballMachine {
    protected int balls;
    private State currentState;

    public GumballMachine(int balls) {
        this.balls = balls;
        this.currentState = new NoQuarter(this);
    }

    void setState(State state) {
        this.currentState = state;
    }
  State getState() {
        return currentState;
    }
    public int getBalls() {
      return balls; 
}
    public void setBalls (int balls) {
      this.balls = balls; 
}
    public void incrementBalls() { this.balls++; }
    public void decrementBalls() { this.balls--; }
    public void insertQuarter() {
        currentState.insertQuarter();
    }
    public void eject() {
        currentState.eject();
    }
    public void turnCrank() {
        currentState.turnCrank();
    }
    public void refill(int amount) {
        currentState.refill(amount);
    }
    public void dispense() {
        currentState.dispense();
    }
    public void abandon() {
        currentState.abandon();
    }
    public void onEntry() {
        currentState.onEntry();
    }
    public void onExit() {
        currentState.onExit();
    }
}
