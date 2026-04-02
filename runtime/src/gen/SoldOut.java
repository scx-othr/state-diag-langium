public class SoldOut extends State {

    public SoldOut(GumballMachine context) {
        super(context);
    }

    @Override
    public void onEntry() {
         System.out.println("Machine is sold out"); 
    }

    /** @prompt Print a message indicating that the machine is getting refilled now. */
    @Override
    public void onExit() {
         // generated start
        // generated end
    }

    /** @prompt add the amount of the balls variable and print a message that the Machine has been refilled to $n Gumballs */
    @Override
    public void refill(int amount) {
        if (true) {
         // generated start
        // generated end
            this.onExit();
            context.setState(new NoQuarter(context));
            context.getState().onEntry();
        }
}
    @Override
    public void abandon() {
        if (true) {
            this.onExit();
            context.setState(new TheEnd(context));
            context.getState().onEntry();
        }
}
}
