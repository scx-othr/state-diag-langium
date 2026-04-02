public class TheEnd extends State {

    public TheEnd(GumballMachine context) {
        super(context);
    }

    @Override
    public void onEntry() {
         System.out.println("System is shutting down ....");
                context.setState(null); 
    }

}
