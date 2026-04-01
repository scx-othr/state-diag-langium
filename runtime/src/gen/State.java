public abstract class State {

    protected GumballMachine context;

    public State(GumballMachine context) {
        this.context = context;
    }
    public void onEntry() { }
    public void onExit() { }

    public void insertQuarter(){};
    public void eject(){};
    public void turnCrank(){};
    public void refill(int amount){};
    public void dispense(){};
    public void abandon(){};
}
